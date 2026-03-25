import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { HomeScreen } from "../app/components/HomeScreen";
import { HomeAuthBar } from "../components/HomeAuthBar";
import { useTripStore } from "../lib/store";
import { SEED_TRIP } from "../lib/seed-data";
import type { Trip } from "../lib/types";
import { useAuth } from "../lib/supabase/auth-context";
import { getSupabase } from "../lib/supabase/client";
import {
  createTripRemote,
  deleteTripRemote,
  listTripsForUser,
} from "../lib/supabase/trips";

export function HomePage() {
  const navigate = useNavigate();
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);
  const upsertTrip = useTripStore((s) => s.upsertTrip);
  const deleteTripFromStore = useTripStore((s) => s.deleteTrip);
  const setUserProfile = useTripStore((s) => s.setUserProfile);

  const { session, configured, profileDisplayName, authReady, user } =
    useAuth();

  const useRemoteHome =
    configured && authReady && !!session?.user && !!getSupabase();

  const [remoteTrips, setRemoteTrips] = useState<Trip[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);

  const reloadRemoteTrips = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session?.user) return;
    setRemoteLoading(true);
    try {
      const list = await listTripsForUser(supabase);
      setRemoteTrips(list);
    } catch (e) {
      console.error("listTripsForUser", e);
      setRemoteTrips([]);
    } finally {
      setRemoteLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (!useRemoteHome) return;
    void reloadRemoteTrips();
  }, [useRemoteHome, reloadRemoteTrips]);

  useEffect(() => {
    if (!useRemoteHome) return;
    const name = profileDisplayName?.trim();
    if (name || user?.email) {
      setUserProfile({
        displayName: name || user!.email!.split("@")[0]!,
        email: user?.email ?? "",
      });
    }
  }, [useRemoteHome, profileDisplayName, user, setUserProfile]);

  useEffect(() => {
    if (useRemoteHome) return;
    const trips = useTripStore.getState().trips;
    if (trips.some((t) => t.id === SEED_TRIP.id)) {
      setCurrentTrip(SEED_TRIP.id);
    }
  }, [useRemoteHome, setCurrentTrip]);

  const withTrip = (tripId: string, path: string) => {
    if (useRemoteHome) {
      const t = remoteTrips.find((x) => x.id === tripId);
      if (t) upsertTrip(t);
    }
    setCurrentTrip(tripId);
    navigate(path);
  };

  const handleRemoteDelete = async (tripId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      await deleteTripRemote(supabase, tripId);
      deleteTripFromStore(tripId);
      await reloadRemoteTrips();
    } catch (e) {
      console.error("deleteTripRemote", e);
    }
  };

  const createTripRemoteFn =
    useRemoteHome && session?.user
      ? async (
          destination: string,
          dates: { start: string; end: string },
          _invitees: { name: string; initial: string }[],
        ) => {
          const supabase = getSupabase();
          if (!supabase) throw new Error("Supabase client unavailable");
          const trip = await createTripRemote(
            supabase,
            session.user.id,
            destination,
            dates,
          );
          upsertTrip(trip);
          await reloadRemoteTrips();
          return trip.id;
        }
      : undefined;

  const remoteGreetingName = useRemoteHome
    ? profileDisplayName?.trim() ||
      user?.email?.split("@")[0] ||
      useTripStore.getState().userProfile.displayName
    : undefined;

  return (
    <HomeScreen
      authSlot={<HomeAuthBar />}
      useRemoteTrips={useRemoteHome}
      remoteTrips={useRemoteHome ? remoteTrips : undefined}
      remoteTripsLoading={useRemoteHome ? remoteLoading : false}
      remoteUserDisplayName={remoteGreetingName}
      onRemoteDeleteTrip={useRemoteHome ? handleRemoteDelete : undefined}
      createTripRemoteFn={createTripRemoteFn}
      onOpenTrip={(tripId) => withTrip(tripId, `/trip/${tripId}/vote`)}
      onOpenImport={(tripId) => withTrip(tripId, `/trip/${tripId}/import`)}
      onCreateTrip={(tripId) => withTrip(tripId, `/trip/${tripId}/import`)}
      onOpenProfile={() => navigate("/profile")}
    />
  );
}
