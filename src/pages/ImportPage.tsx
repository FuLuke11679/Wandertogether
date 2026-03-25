import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ImportScreen } from "../app/components/ImportScreen";
import { useTripStore } from "../lib/store";
import { useRemoteTripHydrate } from "../lib/supabase/use-remote-trip-hydrate";
import { isTikTokUrl, normalizeTikTokUrl } from "../lib/tiktok-url";
import { fetchTikTokTranscript } from "../lib/tiktok-transcript";
import { extractActivities } from "../lib/llm/extract-activities";
import { extractedPlacesToActivities } from "../lib/places-to-activities";
import type { ExtractedPlace } from "../lib/extracted-place";

export function ImportPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const getTrip = useTripStore((s) => s.getTrip);
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);
  const addActivities = useTripStore((s) => s.addActivities);
  const hydrateReady = useRemoteTripHydrate(id);
  const trip = id ? getTrip(id) : undefined;

  useEffect(() => {
    if (id) setCurrentTrip(id);
  }, [id, setCurrentTrip]);

  useEffect(() => {
    if (!id) {
      navigate("/", { replace: true });
      return;
    }
    if (!hydrateReady) return;
    if (!trip) navigate("/", { replace: true });
  }, [id, trip, hydrateReady, navigate]);

  if (!id || !hydrateReady) {
    return null;
  }

  if (!trip) {
    return null;
  }

  return (
    <ImportScreen
      onBack={() => navigate("/")}
      onGoHome={() => navigate("/")}
      tripId={trip.id}
      tripName={trip.destination}
      onExtract={async (rawUrl) => {
        let contentForLLM: string;
        let displayUrl = rawUrl;

        if (isTikTokUrl(rawUrl)) {
          const normalized = normalizeTikTokUrl(rawUrl);
          displayUrl = normalized;
          const transcript = await fetchTikTokTranscript({
            url: normalized,
            language: "en",
          });
          contentForLLM = transcript.transcriptPlain;
        } else {
          contentForLLM = rawUrl;
        }

        const { activities } = await extractActivities(
          contentForLLM,
          displayUrl,
          trip.destination,
        );

        if (activities.length === 0) {
          throw new Error(
            "No places were detected. Try another video or add a place manually.",
          );
        }

        return { activities, displayUrl };
      }}
      onImportPlaces={async (places: ExtractedPlace[]) => {
        const activities = await extractedPlacesToActivities(
          places,
          trip.destination,
          trip.destination,
        );
        addActivities(trip.id, activities);
      }}
    />
  );
}
