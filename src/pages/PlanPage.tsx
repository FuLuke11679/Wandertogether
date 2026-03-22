import { useNavigate, useParams } from "react-router";
import { ItineraryScreen } from "../app/components/ItineraryScreen";
import { useTripStore } from "../lib/store";

export function PlanPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <ItineraryScreen
      onBack={() => navigate(`/trip/${id}/preferences`)}
      onStartDay={(dayIndex) => {
        if (id) {
          useTripStore.getState().startExecution(id, dayIndex);
        }
        navigate(`/trip/${id}/live`);
      }}
      tripId={id}
    />
  );
}
