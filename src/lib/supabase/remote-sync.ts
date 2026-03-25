import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Activity,
  ExecutionState,
  GroupPriority,
  ItineraryDay,
  Trip,
  TripPreferences,
  UserRanking,
} from "../types";
import { DEFAULT_PREFERENCES } from "../seed-data";
import { isRemoteTripId, syncActivitiesForTrip } from "./activities";
import { getSupabase } from "./client";
import { mapDbTripRowToTrip, type TripRow } from "./trips";

/** Narrow slice of the Zustand store to avoid importing `store` (circular). */
export type RemoteSyncGetter = {
  getTrip: (tripId: string) => Trip | undefined;
  execution: ExecutionState;
  completedPairs: string[];
  comparisonCount: number;
  currentTripId: string | null;
};

type RankingPayload = {
  userName: string;
  rankings: UserRanking["rankings"];
};

const TRIP_HYDRATE_SELECT = `
  id,
  owner_id,
  destination,
  date_start,
  date_end,
  cover_image,
  status,
  preferences,
  group_priorities,
  execution_state,
  trip_members (
    user_id,
    role,
    profiles ( display_name )
  )
`;

const defaultExecution = (): ExecutionState => ({
  activeDayIndex: 0,
  activeStopIndex: 0,
  completedIds: [],
  skippedIds: [],
  startedAt: null,
});

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === "object") return raw as T;
  return fallback;
}

export type HydratedTripBundle = {
  trip: Trip;
  execution: ExecutionState;
  completedPairs: string[];
  comparisonCount: number;
};

/**
 * Load trip row + activities + rankings + itinerary + current user's voting session.
 */
export async function fetchHydratedTripBundle(
  supabase: SupabaseClient,
  tripId: string,
): Promise<HydratedTripBundle | null> {
  if (!isRemoteTripId(tripId)) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: row, error: tripErr } = await supabase
    .from("trips")
    .select(TRIP_HYDRATE_SELECT)
    .eq("id", tripId)
    .single();

  if (tripErr || !row) {
    console.error("fetchHydratedTripBundle: trip", tripErr);
    return null;
  }

  const base = mapDbTripRowToTrip(row as unknown as TripRow);

  const prefs = parseJson<TripPreferences>(
    (row as { preferences?: unknown }).preferences,
    DEFAULT_PREFERENCES,
  );
  const groupPriorities = parseJson<GroupPriority[]>(
    (row as { group_priorities?: unknown }).group_priorities,
    [],
  );
  const executionFromRow = parseJson<ExecutionState | null>(
    (row as { execution_state?: unknown }).execution_state,
    null,
  );

  const [actRes, rankRes, itRes, voteRes] = await Promise.all([
    supabase
      .from("activities")
      .select("sort_order, payload")
      .eq("trip_id", tripId)
      .order("sort_order", { ascending: true }),
    supabase.from("rankings").select("user_id, payload").eq("trip_id", tripId),
    supabase.from("itineraries").select("days").eq("trip_id", tripId).maybeSingle(),
    supabase
      .from("trip_voting_session")
      .select("completed_pairs, comparison_count")
      .eq("trip_id", tripId)
      .eq("user_id", session.user.id)
      .maybeSingle(),
  ]);

  const activities: Activity[] =
    actRes.data?.map((r) => r.payload as Activity) ?? [];

  const rankings: UserRanking[] =
    rankRes.data?.map((r) => {
      const p = parseJson<RankingPayload>(r.payload, {
        userName: "Member",
        rankings: [],
      });
      return {
        userId: r.user_id as string,
        userName: p.userName,
        rankings: p.rankings,
      };
    }) ?? [];

  const itinerary: ItineraryDay[] = parseJson<ItineraryDay[]>(
    itRes.data?.days,
    [],
  );

  const completedPairs: string[] = parseJson<string[]>(
    voteRes.data?.completed_pairs,
    [],
  );
  const comparisonCount =
    typeof voteRes.data?.comparison_count === "number"
      ? voteRes.data.comparison_count
      : 0;

  const trip: Trip = {
    ...base,
    preferences: prefs,
    groupPriorities,
    activities,
    rankings,
    itinerary,
  };

  return {
    trip,
    execution: executionFromRow ?? defaultExecution(),
    completedPairs,
    comparisonCount,
  };
}

/**
 * Push trip-shaped state to Supabase (trips JSON columns, itineraries, rankings row,
 * voting session, activities list). No-op if not configured / not UUID / not signed in.
 */
export async function pushRemoteTripSnapshot(
  getState: () => RemoteSyncGetter,
  tripId: string,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isRemoteTripId(tripId)) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return;

  const s = getState();
  const trip = s.getTrip(tripId);
  if (!trip) return;

  const scoped = s.currentTripId === tripId;

  const tripsPatch: Record<string, unknown> = {
    preferences: trip.preferences,
    group_priorities: trip.groupPriorities,
    status: trip.status,
    updated_at: new Date().toISOString(),
  };
  if (scoped) {
    tripsPatch.execution_state = s.execution;
  }

  const { error: te } = await supabase
    .from("trips")
    .update(tripsPatch)
    .eq("id", tripId);
  if (te) console.error("pushRemoteTripSnapshot: trips", te);

  if (trip.itinerary.length > 0) {
    const { error: ie } = await supabase.from("itineraries").upsert(
      {
        trip_id: tripId,
        days: JSON.parse(JSON.stringify(trip.itinerary)) as ItineraryDay[],
        version: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "trip_id" },
    );
    if (ie) console.error("pushRemoteTripSnapshot: itineraries", ie);
  }

  const uid = session.user.id;
  const myRanking = trip.rankings.find((r) => r.userId === uid);
  if (myRanking) {
    const payload: RankingPayload = {
      userName: myRanking.userName,
      rankings: myRanking.rankings,
    };
    const { error: re } = await supabase.from("rankings").upsert(
      {
        trip_id: tripId,
        user_id: uid,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "trip_id,user_id" },
    );
    if (re) console.error("pushRemoteTripSnapshot: rankings", re);
  }

  if (scoped) {
    const { error: ve } = await supabase.from("trip_voting_session").upsert(
      {
        trip_id: tripId,
        user_id: uid,
        completed_pairs: s.completedPairs,
        comparison_count: s.comparisonCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "trip_id,user_id" },
    );
    if (ve) console.error("pushRemoteTripSnapshot: voting_session", ve);
  }

  await syncActivitiesForTrip(tripId, trip.activities);
}
