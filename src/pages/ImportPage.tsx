import { useNavigate, useParams } from "react-router";
import { ImportScreen } from "../app/components/ImportScreen";
import { useTripStore } from "../lib/store";

export function ImportPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const trip = useTripStore((s) => s.getTrip(id ?? ""));

  return (
    <ImportScreen
      onBack={() => navigate("/")}
      onGoHome={() => navigate("/")}
      onContinueToVoting={() => navigate(`/trip/${id}/vote`)}
      tripId={id}
      tripName={trip ? `${trip.destination} Adventure` : undefined}
    />
  );
}
