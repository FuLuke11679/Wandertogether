import type { Activity, ItineraryStop } from "./types";

/** Parse "HH:MM" 24h to minutes from midnight */
export function parseTimeToMinutes(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59 || Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

export function minutesToTime(total: number): string {
  const m = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Max minutes at one stop: anchored to activity.estimatedDuration with a hard
 * per-category cap so temples/shrines can't become all-day blocks when the LLM
 * outputs bad end times.
 */
export function maxVisitMinutesForActivity(a: Activity): number {
  const est =
    a.estimatedDuration && a.estimatedDuration > 0 ? a.estimatedDuration : 90;
  const fromEst = Math.round(est * 1.35) + 25;
  const hardCap =
    a.category === "food"
      ? 150
      : a.category === "culture" || a.category === "nature"
        ? 240
        : 300;
  return Math.min(hardCap, Math.max(25, fromEst));
}

/**
 * Fix LLM itineraries where a single stop spans many hours incorrectly.
 * Re-chains each stop after the previous (start >= prev end + travel) and
 * clamps visit length to maxVisitMinutesForActivity.
 */
export function sanitizeDayStops(stops: ItineraryStop[]): ItineraryStop[] {
  if (stops.length === 0) return stops;
  const out: ItineraryStop[] = [];

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    const maxV = maxVisitMinutesForActivity(s.activity);

    let startM = parseTimeToMinutes(s.startTime);
    if (startM === null) startM = out.length === 0 ? 9 * 60 : parseTimeToMinutes(out[out.length - 1].endTime) ?? 9 * 60;

    if (out.length > 0) {
      const prev = out[out.length - 1];
      const prevEnd = parseTimeToMinutes(prev.endTime);
      const travel = prev.travelToNext?.duration ?? 0;
      if (prevEnd !== null) {
        const minStart = prevEnd + travel;
        if (startM < minStart) startM = minStart;
      }
    }

    const llmEnd = parseTimeToMinutes(s.endTime);
    let visitMin: number;
    if (llmEnd !== null) {
      let span = llmEnd - startM;
      if (span < 0) span += 24 * 60;
      if (span < 20) {
        visitMin = Math.min(maxV, s.activity.estimatedDuration || 60);
      } else {
        visitMin = Math.min(maxV, span);
      }
    } else {
      visitMin = Math.min(maxV, s.activity.estimatedDuration || 90);
    }

    visitMin = Math.max(20, visitMin);
    const endM = startM + visitMin;

    out.push({
      ...s,
      startTime: minutesToTime(startM),
      endTime: minutesToTime(endM),
      travelToNext:
        i < stops.length - 1
          ? s.travelToNext
          : { duration: 0, mode: "walk" as const },
    });
  }

  return out;
}

export function sanitizeItineraryDays(
  days: { date: string; stops: ItineraryStop[] }[],
): { date: string; stops: ItineraryStop[] }[] {
  return days.map((d) => ({
    ...d,
    stops: sanitizeDayStops(d.stops),
  }));
}
