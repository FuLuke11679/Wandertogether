import type { Activity } from "../types";
import { getSupabase } from "./client";

/** Supabase `trips.id` is UUID; local-only trips use strings like `trip-123`. */
const TRIP_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRemoteTripId(tripId: string): boolean {
  return TRIP_UUID_RE.test(tripId);
}

/**
 * Replaces `public.activities` rows for this trip with the current client list.
 * No-op if Supabase is not configured, user is not signed in, or trip id is not a UUID.
 */
export async function syncActivitiesForTrip(
  tripId: string,
  activities: Activity[],
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isRemoteTripId(tripId)) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const { error: delErr } = await supabase
    .from("activities")
    .delete()
    .eq("trip_id", tripId);

  if (delErr) {
    console.error("syncActivitiesForTrip: delete", delErr);
    return;
  }

  if (activities.length === 0) return;

  const rows = activities.map((a, i) => ({
    trip_id: tripId,
    sort_order: i,
    payload: JSON.parse(JSON.stringify(a)) as Record<string, unknown>,
  }));

  const { error: insErr } = await supabase.from("activities").insert(rows);
  if (insErr) console.error("syncActivitiesForTrip: insert", insErr);
}
