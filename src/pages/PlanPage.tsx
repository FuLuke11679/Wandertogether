import { useNavigate, useParams } from "react-router";
import { ItineraryScreen } from "../app/components/ItineraryScreen";

export function PlanPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <ItineraryScreen
      onBack={() => navigate(`/trip/${id}/preferences`)}
      onStartDay={() => navigate(`/trip/${id}/live`)}
    />
  );
}
