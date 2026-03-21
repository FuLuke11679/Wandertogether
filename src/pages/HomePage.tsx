import { useNavigate } from "react-router";
import { HomeScreen } from "../app/components/HomeScreen";
import { useTripStore } from "../lib/store";

export function HomePage() {
  const navigate = useNavigate();
  const currentTrip = useTripStore((s) => s.getCurrentTrip());

  const tripId = currentTrip?.id ?? "tokyo-2026";

  return (
    <HomeScreen
      onOpenTrip={() => navigate(`/trip/${tripId}/vote`)}
      onOpenImport={() => navigate(`/trip/${tripId}/import`)}
      onCreateTrip={() => navigate(`/trip/${tripId}/import`)}
    />
  );
}
