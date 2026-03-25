import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { VotingScreen } from "../app/components/VotingScreen";
import { useTripStore } from "../lib/store";
import { useAuth } from "../lib/supabase/auth-context";
import { useRemoteTripHydrate } from "../lib/supabase/use-remote-trip-hydrate";

export function VotePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentTripId = useTripStore((s) => s.currentTripId);
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);
  const tripId = id ?? currentTripId ?? "";

  const hydrateReady = useRemoteTripHydrate(tripId || undefined);
  const trip = useTripStore((s) => (tripId ? s.getTrip(tripId) : undefined));

  const { session, profileDisplayName, user } = useAuth();
  const voterUserId = session?.user?.id;
  const voterUserName =
    profileDisplayName?.trim() ||
    user?.email?.split("@")[0] ||
    "You";

  useEffect(() => {
    if (tripId) setCurrentTrip(tripId);
  }, [tripId, setCurrentTrip]);

  useEffect(() => {
    if (!tripId) {
      navigate("/", { replace: true });
      return;
    }
    if (!hydrateReady) return;
    if (!trip) {
      navigate("/", { replace: true });
    }
  }, [tripId, trip, hydrateReady, navigate]);

  if (!tripId || !hydrateReady) {
    return null;
  }

  if (!trip) {
    return null;
  }

  return (
    <VotingScreen
      tripId={tripId}
      onBack={() => navigate("/")}
      onSeeResults={() => navigate(`/trip/${tripId}/results`)}
      voterUserId={voterUserId}
      voterUserName={voterUserName}
    />
  );
}
