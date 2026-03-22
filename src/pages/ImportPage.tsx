import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ImportScreen } from "../app/components/ImportScreen";
import { useTripStore } from "../lib/store";
import { extractPlacesFromTikTokUrl } from "../lib/tiktok-import-flow";
import { extractedPlacesToActivities } from "../lib/places-to-activities";
import type { ExtractedPlace } from "../lib/extracted-place";

export function ImportPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const getTrip = useTripStore((s) => s.getTrip);
  const addActivities = useTripStore((s) => s.addActivities);
  const trip = id ? getTrip(id) : undefined;

  useEffect(() => {
    if (!id || !trip) navigate("/", { replace: true });
  }, [id, trip, navigate]);

  if (!id || !trip) {
    return null;
  }

  return (
    <ImportScreen
      onBack={() => navigate("/")}
      onGoHome={() => navigate("/")}
      tripId={trip.id}
      tripName={trip.destination}
      onExtractUrl={(raw) =>
        extractPlacesFromTikTokUrl(raw, { tripDestination: trip.destination })
      }
      onImportPlaces={(places: ExtractedPlace[]) => {
        const activities = extractedPlacesToActivities(
          places,
          trip.destination,
        );
        addActivities(trip.id, activities);
        navigate(`/trip/${trip.id}/vote`);
      }}
    />
  );
}
