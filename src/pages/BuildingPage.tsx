import { useNavigate, useParams } from "react-router";
import { BuildingItineraryScreen } from "../app/components/BuildingItineraryScreen";

export function BuildingPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <BuildingItineraryScreen
      onComplete={() => navigate(`/trip/${id}/plan`, { replace: true })}
      tripId={id}
    />
  );
}
