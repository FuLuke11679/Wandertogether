import type { Activity, ActivityCategory } from "./types";
import { clampExtractedEstimatedDuration } from "./clamp-extracted-duration";
import type { ExtractedPlace } from "./extracted-place";

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

/** Map imported sheet rows to store activities (approximate map coords for demo). */
export function extractedPlacesToActivities(
  places: ExtractedPlace[],
  neighborhoodFallback: string,
): Activity[] {
  const baseLat = 35.6762;
  const baseLng = 139.6503;
  return places.map((p, i) => {
    const category = CAT_MAP[p.category] ?? "culture";
    return {
    id: `import-${Date.now()}-${i}-${p.name.slice(0, 12).replace(/\s+/g, "-")}`,
    name: p.name,
    description: "Imported from TikTok transcript",
    location: {
      lat: baseLat + i * 0.012,
      lng: baseLng + i * 0.015,
      neighborhood: neighborhoodFallback,
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
