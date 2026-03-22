import type {
  Activity,
  ItineraryStop,
  SalvageResult,
  SalvageReason,
} from "../types";
import { sanitizeDayStops } from "../itinerary-sanitize-times";
import { post } from "./client";

type AdaptApiStop = {
  activityId: string;
  startTime: string;
  endTime: string;
  travelToNext: { duration: number; mode: "walk" | "transit" | "taxi" };
  priority: number;
};

type AdaptApiResult = {
  stops: AdaptApiStop[];
  message: string;
};

function hydrateStops(
  apiStops: AdaptApiStop[],
  activityMap: Map<string, Activity>,
): ItineraryStop[] {
  const raw = apiStops
    .filter((s) => activityMap.has(s.activityId))
    .map((s) => ({
      activity: activityMap.get(s.activityId)!,
      startTime: s.startTime,
      endTime: s.endTime,
      travelToNext: s.travelToNext,
      priority: s.priority,
      status: "upcoming" as const,
    }));
  return sanitizeDayStops(raw);
}

// ── Fallback: rebuild locally by dropping skipped + recomputing times ────────

function buildLocalSalvage(
  itinerary: ItineraryStop[],
  completedIds: string[],
  skippedIds: string[],
  reason?: SalvageReason,
): SalvageResult {
  const skipSet = new Set([...completedIds, ...skippedIds]);
  let remaining = itinerary.filter((s) => !skipSet.has(s.activity.id));

  if (reason === "tired") {
    remaining = remaining.slice(0, Math.max(2, Math.ceil(remaining.length * 0.6)));
  }

  if (reason === "weather") {
    const indoor = new Set(["food", "culture", "shopping", "nightlife"]);
    const indoorStops = remaining.filter((s) => indoor.has(s.activity.category));
    if (indoorStops.length >= 2) remaining = indoorStops;
  }

  if (reason === "late" && remaining.length > 2) {
    remaining = remaining.slice(0, remaining.length - 1);
  }

  const now = new Date();
  let cursor = now.getHours() * 60 + now.getMinutes() + 10;

  const stops: ItineraryStop[] = remaining.map((stop, i) => {
    const startTime = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
    cursor += stop.activity.estimatedDuration;
    const endTime = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;

    const travelMin = i < remaining.length - 1 ? stop.travelToNext.duration || 15 : 0;
    cursor += travelMin;

    return {
      ...stop,
      startTime,
      endTime,
      travelToNext: {
        duration: travelMin,
        mode: i < remaining.length - 1 ? stop.travelToNext.mode : ("walk" as const),
      },
      priority: i + 1,
      status: "upcoming" as const,
    };
  });

  const messages: Record<string, string> = {
    tired:
      "You're running low on energy — I've trimmed the rest of the day to just the highlights so you can take it easy.",
    weather:
      "Weather's not cooperating! I've shifted to indoor spots so you stay dry and comfortable.",
    late:
      "Running a bit behind schedule — I've dropped the lowest-priority stop and tightened up the times.",
    other:
      "Plans changed! I've re-optimized your remaining stops to make the most of your time.",
  };

  return {
    stops,
    message: messages[reason ?? "other"] ?? messages.other,
  };
}

export async function adaptTrip(
  itinerary: ItineraryStop[],
  completedIds: string[],
  skippedIds: string[],
  allActivities: Activity[],
  reason?: SalvageReason,
  destination?: string,
  detail?: string,
): Promise<{ result: SalvageResult; fromLLM: boolean }> {
  const actMap = new Map(allActivities.map((a) => [a.id, a]));
  const currentTime = new Date().toTimeString().slice(0, 5);

  try {
    const apiItinerary = itinerary.map((s) => ({
      activityId: s.activity.id,
      activityName: s.activity.name,
      startTime: s.startTime,
      endTime: s.endTime,
      category: s.activity.category,
      priority: s.priority,
      location: s.activity.location,
    }));

    const apiActivities = allActivities.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      estimatedDuration: a.estimatedDuration,
      location: a.location,
    }));

    const apiResult = await post<AdaptApiResult>("/adapt-trip", {
      currentItinerary: apiItinerary,
      completedIds,
      skippedIds,
      currentTime,
      reason,
      detail,
      allActivities: apiActivities,
      destination: destination ?? "Tokyo",
    });

    if (!apiResult.stops?.length) throw new Error("Empty salvage response");

    return {
      result: {
        stops: hydrateStops(apiResult.stops, actMap),
        message: apiResult.message,
      },
      fromLLM: true,
    };
  } catch (err) {
    console.warn("LLM adaptation unavailable, using local salvage:", err);
    return {
      result: buildLocalSalvage(itinerary, completedIds, skippedIds, reason),
      fromLLM: false,
    };
  }
}
