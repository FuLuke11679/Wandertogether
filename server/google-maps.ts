import { isValidMapCoordinate } from "../src/lib/geo";

/**
 * Google Maps Platform: Geocoding API + Distance Matrix API (server-side only).
 * Enable both in Google Cloud Console and restrict key by API.
 */

const GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode/json";
const DISTANCE_MATRIX_BASE =
  "https://maps.googleapis.com/maps/api/distancematrix/json";

export type GeocodedPlace = {
  lat: number;
  lng: number;
  neighborhood: string;
  googlePlaceId: string;
  formattedAddress?: string;
};

type GeocodeComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GeocodeResult = {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  place_id: string;
  address_components?: GeocodeComponent[];
};

function neighborhoodFromComponents(
  components: GeocodeComponent[] | undefined,
): string {
  if (!components?.length) return "";
  const order = [
    "neighborhood",
    "sublocality_level_1",
    "sublocality",
    "locality",
    "administrative_area_level_1",
  ];
  for (const t of order) {
    const c = components.find((x) => x.types.includes(t));
    if (c) return c.long_name;
  }
  return "";
}

export function getGoogleMapsApiKey(): string | null {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key || key.includes("your-")) return null;
  return key;
}

/** Single geocode query (URL-encoded address string). */
export async function geocodeQuery(
  address: string,
  apiKey: string,
): Promise<GeocodedPlace | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    address: trimmed,
    key: apiKey,
  });

  const res = await fetch(`${GEOCODE_BASE}?${params.toString()}`);
  if (!res.ok) {
    console.warn("Geocoding HTTP error:", res.status);
    return null;
  }

  const data = (await res.json()) as {
    status: string;
    results?: GeocodeResult[];
    error_message?: string;
  };

  if (data.status !== "OK" || !data.results?.[0]) {
    if (data.status !== "ZERO_RESULTS") {
      console.warn("Geocoding status:", data.status, data.error_message ?? "");
    }
    return null;
  }

  const r = data.results[0];
  const { lat, lng } = r.geometry.location;
  return {
    lat,
    lng,
    neighborhood: neighborhoodFromComponents(r.address_components),
    googlePlaceId: r.place_id,
    formattedAddress: r.formatted_address,
  };
}

/**
 * Try progressively broader queries so we resolve POIs in the trip city.
 */
export async function geocodePlaceInDestination(
  name: string,
  neighborhoodHint: string,
  destination: string,
  apiKey: string,
): Promise<GeocodedPlace | null> {
  const parts = [
    [name, neighborhoodHint, destination].filter(Boolean).join(", "),
    [name, destination].filter(Boolean).join(", "),
    destination.trim(),
  ];

  const tried = new Set<string>();
  for (const q of parts) {
    if (!q || tried.has(q)) continue;
    tried.add(q);
    const g = await geocodeQuery(q, apiKey);
    if (g) return g;
  }
  return null;
}

export type TransitModeHint = "walk" | "transit" | "taxi";

function distanceMatrixMode(
  mode: TransitModeHint,
): { travelMode: string; departureTime?: number } {
  switch (mode) {
    case "walk":
      return { travelMode: "walking" };
    case "taxi":
      return { travelMode: "driving" };
    case "transit":
    default:
      return {
        travelMode: "transit",
        departureTime: Math.floor(Date.now() / 1000),
      };
  }
}

/**
 * Duration in minutes between two points (ceiling), or null if unavailable.
 */
export async function getLegDurationMinutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TransitModeHint,
  apiKey: string,
): Promise<number | null> {
  const { travelMode, departureTime } = distanceMatrixMode(mode);
  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: `${destination.lat},${destination.lng}`,
    mode: travelMode,
    key: apiKey,
  });
  if (departureTime != null) {
    params.set("departure_time", String(departureTime));
  }

  const res = await fetch(`${DISTANCE_MATRIX_BASE}?${params.toString()}`);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status: string;
    rows?: Array<{
      elements?: Array<{
        status: string;
        duration?: { value: number };
        duration_in_traffic?: { value: number };
      }>;
    }>;
    error_message?: string;
  };

  if (data.status !== "OK") {
    console.warn("Distance Matrix status:", data.status, data.error_message);
    return null;
  }

  const el = data.rows?.[0]?.elements?.[0];
  if (!el || el.status !== "OK") {
    return null;
  }

  const seconds =
    el.duration_in_traffic?.value ?? el.duration?.value ?? null;
  if (seconds == null) return null;

  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return Math.min(minutes, 180);
}

/**
 * If transit matrix fails, fall back to driving then walking estimate.
 */
export async function getLegDurationMinutesWithFallback(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TransitModeHint,
  apiKey: string,
): Promise<number | null> {
  const modes: TransitModeHint[] =
    mode === "transit"
      ? ["transit", "taxi", "walk"]
      : mode === "taxi"
        ? ["taxi", "walk"]
        : ["walk", "taxi"];

  for (const m of modes) {
    const min = await getLegDurationMinutes(origin, destination, m, apiKey);
    if (min != null) return min;
  }
  return null;
}

export type ItineraryStopLike = {
  activityId: string;
  startTime: string;
  endTime: string;
  travelToNext: { duration: number; mode: TransitModeHint };
  priority: number;
};

export type ItineraryDayLike = { date: string; stops: ItineraryStopLike[] };

/**
 * Overwrite travelToNext.duration using Distance Matrix when coords are valid.
 */
export type RawExtractedActivity = {
  name: string;
  description?: string;
  category?: string;
  estimatedDuration?: number;
  location?: { lat: number; lng: number; neighborhood?: string };
  emoji?: string;
};

/** After LLM extraction, replace coordinates with Geocoding API results when possible. */
export async function enrichRawActivitiesWithGeocode(
  activities: unknown[],
  destination: string,
  apiKey: string,
): Promise<unknown[]> {
  if (!Array.isArray(activities)) return activities;
  const out: unknown[] = [];
  for (const raw of activities) {
    if (!raw || typeof raw !== "object" || !("name" in raw)) {
      out.push(raw);
      continue;
    }
    const a = raw as RawExtractedActivity;
    const name = String(a.name);
    const nb = a.location?.neighborhood ?? "";
    const g = await geocodePlaceInDestination(name, nb, destination, apiKey);
    if (g) {
      out.push({
        ...a,
        location: {
          lat: g.lat,
          lng: g.lng,
          neighborhood: g.neighborhood || nb || "",
          googlePlaceId: g.googlePlaceId,
          ...(g.formattedAddress
            ? { formattedAddress: g.formattedAddress }
            : {}),
        },
      });
    } else {
      out.push(raw);
    }
  }
  return out;
}

export async function enrichItineraryTravelTimes(
  days: ItineraryDayLike[],
  activityLocations: Map<
    string,
    { lat: number; lng: number }
  >,
  apiKey: string,
): Promise<ItineraryDayLike[]> {
  const out: ItineraryDayLike[] = [];

  for (const day of days) {
    const stops = [...day.stops];
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const next = stops[i + 1];
      if (!next) {
        stop.travelToNext = { duration: 0, mode: "walk" };
        continue;
      }

      const a = activityLocations.get(stop.activityId);
      const b = activityLocations.get(next.activityId);
      if (
        !a ||
        !b ||
        !isValidMapCoordinate(a.lat, a.lng) ||
        !isValidMapCoordinate(b.lat, b.lng)
      ) {
        continue;
      }

      const mode = stop.travelToNext.mode;
      const minutes = await getLegDurationMinutesWithFallback(
        a,
        b,
        mode,
        apiKey,
      );
      if (minutes != null) {
        const buffered = Math.min(180, minutes + 10);
        stop.travelToNext = {
          ...stop.travelToNext,
          duration: buffered,
        };
      }
    }
    out.push({ ...day, stops });
  }

  return out;
}

const STATIC_MAP_BASE = "https://maps.googleapis.com/maps/api/staticmap";

function staticMapMarkerLabel(i: number): string {
  if (i < 9) return String(i + 1);
  if (i < 35) return String.fromCharCode(65 + (i - 9));
  return String((i % 9) + 1);
}

/** PNG image bytes for the day’s route, or null if the request fails. */
export async function fetchItineraryStaticMapPng(
  points: { lat: number; lng: number }[],
  apiKey: string,
): Promise<Buffer | null> {
  const cleaned = points.filter((p) =>
    isValidMapCoordinate(p.lat, p.lng),
  );
  if (cleaned.length === 0) return null;

  const url = new URL(STATIC_MAP_BASE);
  // Google caps output at 640px per dimension; size is multiplied by scale.
  // 390×270 @ scale=2 → 780×540 → rejected (width > 640) → img gets non-PNG 502.
  url.searchParams.set("size", "390x270");
  url.searchParams.set("scale", "1");
  url.searchParams.set("maptype", "roadmap");
  url.searchParams.set("key", apiKey);

  if (cleaned.length === 1) {
    const p = cleaned[0];
    url.searchParams.set("center", `${p.lat},${p.lng}`);
    url.searchParams.set("zoom", "15");
    url.searchParams.append(
      "markers",
      `color:0xE85D3A|label:${staticMapMarkerLabel(0)}|${p.lat},${p.lng}`,
    );
  } else {
    const visible = cleaned.map((p) => `${p.lat},${p.lng}`).join("|");
    url.searchParams.set("visible", visible);
    const pathStr =
      `color:0xE85D3A|weight:4|` +
      cleaned.map((p) => `${p.lat},${p.lng}`).join("|");
    url.searchParams.set("path", pathStr);
    const maxMarkers = Math.min(cleaned.length, 15);
    for (let i = 0; i < maxMarkers; i++) {
      const p = cleaned[i];
      url.searchParams.append(
        "markers",
        `color:0xE85D3A|label:${staticMapMarkerLabel(i)}|${p.lat},${p.lng}`,
      );
    }
  }

  const res = await fetch(url.toString());
  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok || !ct.includes("image")) {
    const text = await res.text().catch(() => "");
    console.warn(
      "Static Maps API error:",
      res.status,
      text.slice(0, 300),
    );
    return null;
  }

  return Buffer.from(await res.arrayBuffer());
}
