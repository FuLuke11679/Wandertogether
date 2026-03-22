import type { ActivityCategory } from "./types";

/**
 * Caps LLM / heuristic duration estimates for a single POI so phrases like
 * "whole day" in a transcript don't become 8+ hour blocks for one temple.
 */
export function clampExtractedEstimatedDuration(
  minutes: number,
  category: ActivityCategory,
): number {
  const m =
    Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 60;
  const caps: Record<ActivityCategory, number> = {
    food: 150,
    culture: 240,
    shopping: 180,
    nature: 240,
    nightlife: 240,
    adventure: 300,
  };
  const cap = caps[category] ?? 240;
  return Math.min(cap, Math.max(15, m));
}
