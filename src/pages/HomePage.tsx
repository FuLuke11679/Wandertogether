import { useNavigate } from "react-router";
import { HomeScreen } from "../app/components/HomeScreen";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <HomeScreen
      onOpenTrip={(tripId) => navigate(`/trip/${tripId}/plan`)}
      onOpenImport={(tripId) => navigate(`/trip/${tripId}/import`)}
      onCreateTrip={(tripId) => navigate(`/trip/${tripId}/import`)}
    />
  );
}
