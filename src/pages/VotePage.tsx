import { useNavigate, useParams } from "react-router";
import { VotingScreen } from "../app/components/VotingScreen";
import { useTripStore } from "../lib/store";

export function VotePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentTripId = useTripStore((s) => s.currentTripId);
  const tripId = id ?? currentTripId ?? "";

  if (!tripId) {
    navigate("/");
    return null;
  }

  return (
    <VotingScreen
      tripId={tripId}
      onBack={() => navigate("/")}
      onSeeResults={() => navigate(`/trip/${tripId}/results`)}
    />
  );
}
