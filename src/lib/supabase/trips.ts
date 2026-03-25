import type { SupabaseClient } from "@supabase/supabase-js";
import type { Trip, TripMember, TripStatus } from "../types";
import { DEFAULT_PREFERENCES } from "../seed-data";

type ProfileEmbed = { display_name: string | null } | null;

type MemberRow = {
  user_id: string;
  role: string;
  profiles:
    | ProfileEmbed
    | { display_name: string | null }[]
    | null;
};

function normalizeProfile(
  p: MemberRow["profiles"],
): { display_name: string | null } | null {
  if (p == null) return null;
  if (Array.isArray(p)) return p[0] ?? null;
  return p;
}

export type TripRow = {
  id: string;
  owner_id: string;
  destination: string;
  date_start: string;
  date_end: string;
  cover_image: string | null;
  status: string;
  trip_members?: MemberRow[] | null;
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  const c = name.trim()[0];
  return c ? c.toUpperCase() : "?";
}

export function mapDbTripRowToTrip(row: TripRow): Trip {
  const rawMembers = row.trip_members ?? [];
  const members: TripMember[] = rawMembers.map((tm) => {
    const prof = normalizeProfile(tm.profiles);
    const name = prof?.display_name?.trim() || "Member";
    return {
      id: tm.user_id,
      name,
      initials: initialsFrom(name),
    };
  });

  return {
    id: row.id,
    destination: row.destination,
    dates: { start: row.date_start, end: row.date_end },
    coverImage: row.cover_image ?? undefined,
    status: row.status as TripStatus,
    activities: [],
    members:
      members.length > 0
        ? members
        : [{ id: row.owner_id, name: "You", initials: "Y" }],
    rankings: [],
    groupPriorities: [],
    preferences: { ...DEFAULT_PREFERENCES },
    itinerary: [],
  };
}

const TRIP_SELECT = `
  id,
  owner_id,
  destination,
  date_start,
  date_end,
  cover_image,
  status,
  trip_members (
    user_id,
    role,
    profiles ( display_name )
  )
`;

export async function listTripsForUser(
  supabase: SupabaseClient,
): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as unknown as TripRow[];
  return rows.map(mapDbTripRowToTrip);
}

export async function createTripRemote(
  supabase: SupabaseClient,
  ownerId: string,
  destination: string,
  dates: { start: string; end: string },
): Promise<Trip> {
  const { data, error } = await supabase
    .from("trips")
    .insert({
      owner_id: ownerId,
      destination,
      date_start: dates.start,
      date_end: dates.end,
      status: "draft",
    })
    .select(TRIP_SELECT)
    .single();

  if (error) throw error;
  return mapDbTripRowToTrip(data as unknown as TripRow);
}

export async function deleteTripRemote(
  supabase: SupabaseClient,
  tripId: string,
): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;
}
