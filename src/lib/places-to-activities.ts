import type { Activity, ActivityCategory } from "./types";
import { clampExtractedEstimatedDuration } from "./clamp-extracted-duration";
import type { ExtractedPlace } from "./extracted-place";
import { post } from "./llm/client";

const CAT_MAP: Record<string, ActivityCategory> = {
  Food: "food",
  Culture: "culture",
  Shopping: "shopping",
  Nature: "nature",
  Nightlife: "nightlife",
};

function parseDurationMin(duration: string): number {
  const d = duration.toLowerCase();
  const hr = d.match(/(\d+(?:\.\d+)?)\s*hr/);
  if (hr) return Math.round(parseFloat(hr[1]) * 60);
  const min = d.match(/(\d+)\s*min/);
  if (min) return parseInt(min[1], 10);
  return 60;
}

type GeocodePlacesResponse = {
  locations: Array<{
    lat: number;
    lng: number;
    neighborhood: string;
    googlePlaceId?: string;
  } | null>;
  destinationCenter: { lat: number; lng: number } | null;
};

const DEFAULT_BASE = { lat: 35.6762, lng: 139.6503 };

/**
 * Map import sheet rows to activities with Google Geocoding (server).
 * Falls back to a grid around destination center (or Tokyo) if the API is unavailable.
 */
export async function extractedPlacesToActivities(
  places: ExtractedPlace[],
  neighborhoodFallback: string,
  destination: string,
): Promise<Activity[]> {
  let baseLat = DEFAULT_BASE.lat;
  let baseLng = DEFAULT_BASE.lng;
  let locations: GeocodePlacesResponse["locations"] = [];

  try {
    const res = await post<GeocodePlacesResponse>("/geocode-places", {
      destination,
      places: places.map((p) => ({
        name: p.name,
        neighborhood: neighborhoodFallback,
      })),
    });
    locations = res.locations ?? [];
    if (res.destinationCenter) {
      baseLat = res.destinationCenter.lat;
      baseLng = res.destinationCenter.lng;
    }
  } catch {
    locations = places.map(() => null);
  }

  return places.map((p, i) => {
    const category = CAT_MAP[p.category] ?? "culture";
    const geo = locations[i];
    const lat = geo?.lat ?? baseLat + i * 0.012;
    const lng = geo?.lng ?? baseLng + i * 0.015;
    const neighborhood =
      geo?.neighborhood?.trim() || neighborhoodFallback;
    return {
      id: `import-${Date.now()}-${i}-${p.name.slice(0, 12).replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2, 9)}`,
      name: p.name,
      description: "Imported from TikTok transcript",
      location: {
        lat,
        lng,
        neighborhood,
        ...(geo?.googlePlaceId
          ? { googlePlaceId: geo.googlePlaceId }
          : {}),
      },
      category,
      estimatedDuration: clampExtractedEstimatedDuration(
        parseDurationMin(p.duration),
        category,
      ),
      emoji: p.emoji,
      source: "tiktok",
    };
  });
}
