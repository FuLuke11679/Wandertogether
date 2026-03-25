import { useEffect, useState } from "react";
import { isRemoteTripId } from "./activities";
import { applyHydratedTripBundle } from "./apply-hydrated-bundle";
import { getSupabase } from "./client";
import { fetchHydratedTripBundle } from "./remote-sync";

/**
 * For Supabase trip UUIDs, fetches full trip bundle before rendering trip-scoped pages.
 * Local/demo trip ids resolve immediately.
 */
export function useRemoteTripHydrate(tripId: string | undefined): boolean {
  const [ready, setReady] = useState(
    () =>
      !tripId || !isRemoteTripId(tripId) || getSupabase() == null,
  );

  useEffect(() => {
    if (!tripId) {
      setReady(true);
      return;
    }
    if (!isRemoteTripId(tripId)) {
      setReady(true);
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    void fetchHydratedTripBundle(supabase, tripId).then((bundle) => {
      if (cancelled) return;
      if (bundle) applyHydratedTripBundle(bundle);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  return ready;
}
