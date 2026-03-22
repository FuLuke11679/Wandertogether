import type { Activity } from "../types";
import { clampExtractedEstimatedDuration } from "../clamp-extracted-duration";
import { post } from "./client";

type RawExtracted = {
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
  location: { lat: number; lng: number; neighborhood: string };
  emoji?: string;
};

function toActivity(raw: RawExtracted, sourceUrl?: string): Activity {
  const id = raw.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const category = (raw.category ?? "culture") as Activity["category"];
  const rawMin = raw.estimatedDuration ?? 60;

  return {
    id,
    name: raw.name,
    description: raw.description,
    category,
    estimatedDuration: clampExtractedEstimatedDuration(rawMin, category),
    location: raw.location,
    emoji: raw.emoji,
    source: sourceUrl,
  };
}

// ── Fallback: demo activities that simulate extraction ──────────────────────

const FALLBACK_EXTRACTED: Activity[] = [
  {
    id: "omoide-yokocho",
    name: "Omoide Yokocho",
    description: "Atmospheric alley of tiny yakitori stalls under the train tracks near Shinjuku Station",
    category: "food",
    estimatedDuration: 60,
    location: { lat: 35.6934, lng: 139.6982, neighborhood: "Shinjuku" },
    emoji: "🍢",
  },
  {
    id: "roppongi-hills",
    name: "Roppongi Hills Mori Tower",
    description: "Observation deck with panoramic city views plus the Mori Art Museum",
    category: "culture",
    estimatedDuration: 90,
    location: { lat: 35.6605, lng: 139.7292, neighborhood: "Roppongi" },
    emoji: "🏙️",
  },
  {
    id: "yanaka-ginza",
    name: "Yanaka Ginza",
    description: "Retro shopping street with traditional snacks and old-Tokyo charm",
    category: "shopping",
    estimatedDuration: 45,
    location: { lat: 35.7265, lng: 139.7671, neighborhood: "Yanaka" },
    emoji: "🏘️",
  },
  {
    id: "shimokitazawa",
    name: "Shimokitazawa",
    description: "Bohemian neighborhood known for vintage shops, live music, and cozy cafes",
    category: "shopping",
    estimatedDuration: 75,
    location: { lat: 35.6613, lng: 139.6686, neighborhood: "Shimokitazawa" },
    emoji: "🎸",
  },
  {
    id: "odaiba-seaside",
    name: "Odaiba Seaside Park",
    description: "Waterfront park with views of Rainbow Bridge and a replica Statue of Liberty",
    category: "nature",
    estimatedDuration: 60,
    location: { lat: 35.6275, lng: 139.7753, neighborhood: "Odaiba" },
    emoji: "🌊",
  },
];

export async function extractActivities(
  content: string,
  sourceUrl?: string,
): Promise<{ activities: Activity[]; fromLLM: boolean }> {
  try {
    const res = await post<{ activities: RawExtracted[] }>(
      "/extract-activities",
      { content, sourceUrl },
    );

    if (!Array.isArray(res.activities) || res.activities.length === 0) {
      throw new Error("Empty response");
    }

    return {
      activities: res.activities.map((r) => toActivity(r, sourceUrl)),
      fromLLM: true,
    };
  } catch (err) {
    console.warn("LLM extraction unavailable, using fallback:", err);
    return {
      activities: FALLBACK_EXTRACTED.map((a) => ({
        ...a,
        source: sourceUrl,
      })),
      fromLLM: false,
    };
  }
}
