import { useEffect } from "react";
import { useNavigate } from "react-router";
import { HomeScreen } from "../app/components/HomeScreen";
import { useTripStore } from "../lib/store";
import { SEED_TRIP } from "../lib/seed-data";

export function HomePage() {
  const navigate = useNavigate();
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);

  const withTrip = (tripId: string, path: string) => {
    setCurrentTrip(tripId);
    navigate(path);
  };

  // Default: Tokyo demo trip is active whenever Home loads (hackathon demo / voting flow)
  useEffect(() => {
    const trips = useTripStore.getState().trips;
    if (trips.some((t) => t.id === SEED_TRIP.id)) {
      setCurrentTrip(SEED_TRIP.id);
    }
  }, [setCurrentTrip]);

  return (
    <HomeScreen
      onOpenTrip={(tripId) => withTrip(tripId, `/trip/${tripId}/vote`)}
      onOpenImport={(tripId) => withTrip(tripId, `/trip/${tripId}/import`)}
      onCreateTrip={(tripId) => withTrip(tripId, `/trip/${tripId}/import`)}
    />
  );
}
