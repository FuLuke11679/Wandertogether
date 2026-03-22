import type {
  Activity,
  GroupPriority,
  TripPreferences,
  ItineraryStop,
  ItineraryDay,
} from "../types";
import { post } from "./client";

type ItineraryApiStop = {
  activityId: string;
  startTime: string;
  endTime: string;
  travelToNext: { duration: number; mode: "walk" | "transit" | "taxi" };
  priority: number;
};

type ItineraryApiDay = {
  date: string;
  stops: ItineraryApiStop[];
};

type ItineraryApiResult = {
  days: ItineraryApiDay[];
  reasoning?: string;
};

function hydrateStops(
  apiStops: ItineraryApiStop[],
  activityMap: Map<string, Activity>,
): ItineraryStop[] {
  return apiStops
    .filter((s) => activityMap.has(s.activityId))
    .map((s) => ({
      activity: activityMap.get(s.activityId)!,
      startTime: s.startTime,
      endTime: s.endTime,
      travelToNext: s.travelToNext,
      priority: s.priority,
      status: "upcoming" as const,
    }));
}

function hydrateDays(
  apiDays: ItineraryApiDay[],
  activityMap: Map<string, Activity>,
): ItineraryDay[] {
  return apiDays.map((d) => ({
    date: d.date,
    stops: hydrateStops(d.stops, activityMap),
  }));
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates.length > 0 ? dates : [start];
}

function buildLocalItinerary(
  activities: Activity[],
  priorities: GroupPriority[],
  prefs: TripPreferences,
  dates: { start: string; end: string },
): ItineraryDay[] {
  const sorted = [...priorities].sort(
    (a, b) => b.compositeScore - a.compositeScore,
  );
  const actMap = new Map(activities.map((a) => [a.id, a]));
  const allDates = getDatesInRange(dates.start, dates.end);

  const paceCount =
    prefs.pace === "relaxed" ? 5 : prefs.pace === "packed" ? 8 : 6;
  const durationMultiplier =
    prefs.pace === "relaxed" ? 1.2 : prefs.pace === "packed" ? 0.9 : 1.0;

  const validPriorities = sorted.filter((p) => actMap.has(p.activityId));
  const days: ItineraryDay[] = [];

  for (let dayIdx = 0; dayIdx < allDates.length; dayIdx++) {
    const dayActivities = validPriorities.slice(
      dayIdx * paceCount,
      (dayIdx + 1) * paceCount,
    );
    if (dayActivities.length === 0) break;

    const [startH, startM] = prefs.startTime.split(":").map(Number);
    let cursor = startH * 60 + startM;

    const stops: ItineraryStop[] = dayActivities.map((gp, i) => {
      const act = actMap.get(gp.activityId)!;
      const duration = Math.round(act.estimatedDuration * durationMultiplier);
      const startTime = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
      cursor += duration;
      const endTime = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;

      const travelMin = i < dayActivities.length - 1 ? 15 : 0;
      const travelMode =
        prefs.walkingTolerance === "explorer"
          ? ("walk" as const)
          : ("transit" as const);
      cursor += travelMin;

      return {
        activity: act,
        startTime,
        endTime,
        travelToNext: {
          duration: travelMin,
          mode: i < dayActivities.length - 1 ? travelMode : ("walk" as const),
        },
        priority: i + 1,
        status: "upcoming" as const,
      };
    });

    days.push({ date: allDates[dayIdx], stops });
  }

  return days;
}

export async function generateItinerary(
  activities: Activity[],
  priorities: GroupPriority[],
  prefs: TripPreferences,
  dates: { start: string; end: string },
  destination: string,
): Promise<{ days: ItineraryDay[]; reasoning?: string; fromLLM: boolean }> {
  const actMap = new Map(activities.map((a) => [a.id, a]));

  const rankedActivities = [...priorities]
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .filter((p) => actMap.has(p.activityId))
    .map((p) => {
      const act = actMap.get(p.activityId)!;
      return {
        id: act.id,
        name: act.name,
        description: act.description,
        category: act.category,
        estimatedDuration: act.estimatedDuration,
        location: act.location,
        compositeScore: p.compositeScore,
      };
    });

  try {
    const result = await post<ItineraryApiResult>("/generate-itinerary", {
      activities: rankedActivities,
      preferences: prefs,
      dates,
      destination,
    });

    if (!result.days?.length) throw new Error("Empty itinerary response");

    return {
      days: hydrateDays(result.days, actMap),
      reasoning: result.reasoning,
      fromLLM: true,
    };
  } catch (err) {
    console.warn("LLM itinerary unavailable, using local builder:", err);
    return {
      days: buildLocalItinerary(activities, priorities, prefs, dates),
      fromLLM: false,
    };
  }
}
