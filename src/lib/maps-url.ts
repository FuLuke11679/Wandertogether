import { isValidMapCoordinate } from "./geo";
import type { Activity } from "./types";

/**
 * Human-readable query for Google Maps (prefer address from geocoding, then name + area + trip).
 */
export function buildMapsDestinationQuery(
  activity: Activity,
  tripDestination?: string,
): string {
  const fa = activity.location.formattedAddress?.trim();
  if (fa) return fa;
  const parts = [
    activity.name.trim(),
    activity.location.neighborhood?.trim(),
    tripDestination?.trim(),
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Label paired with destination_place_id (Google requires both).
 * Prefer formatted address, then venue name.
 */
function directionsDestinationLabel(activity: Activity): string {
  return (
    activity.location.formattedAddress?.trim() ||
    activity.name.trim() ||
    buildMapsDestinationQuery(activity, undefined)
  );
}

/**
 * Opens Google Maps **directions** to the stop. Optimized for correct place resolution:
 * 1. place_id + human label (from geocoding address or name)
 * 2. Named query (name, neighborhood, city) — avoids wrong lat/lng from bad extraction
 * 3. Coordinates only if there is no usable text
 * 4. Search fallback
 *
 * @see https://developers.google.com/maps/documentation/urls/get-started
 */
export function getGoogleMapsDirectionsUrl(
  activity: Activity,
  tripDestination?: string,
): string {
  const pid = activity.location.googlePlaceId?.trim();
  const query = buildMapsDestinationQuery(activity, tripDestination);

  if (pid) {
    const params = new URLSearchParams({
      api: "1",
      destination: directionsDestinationLabel(activity),
      destination_place_id: pid,
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  if (query.length > 0) {
    const params = new URLSearchParams({
      api: "1",
      destination: query,
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  const { lat, lng } = activity.location;
  if (isValidMapCoordinate(lat, lng)) {
    const params = new URLSearchParams({
      api: "1",
      destination: `${lat},${lng}`,
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  const searchParams = new URLSearchParams({
    api: "1",
    query: activity.name.trim() || "place",
  });
  return `https://www.google.com/maps/search/?${searchParams.toString()}`;
}

/**
 * Opens Maps in **search / place** mode (no “directions from current location” step).
 * Uses query_place_id when available for an exact match.
 */
export function getGoogleMapsSearchUrl(
  activity: Activity,
  tripDestination?: string,
): string {
  const pid = activity.location.googlePlaceId?.trim();
  const q = buildMapsDestinationQuery(activity, tripDestination);
  const params = new URLSearchParams({ api: "1" });

  if (pid) {
    params.set("query", activity.name.trim() || q || "place");
    params.set("query_place_id", pid);
  } else if (q.length > 0) {
    params.set("query", q);
  } else {
    const { lat, lng } = activity.location;
    if (isValidMapCoordinate(lat, lng)) {
      params.set("query", `${lat},${lng}`);
    } else {
      params.set("query", activity.name.trim() || "place");
    }
  }

  return `https://www.google.com/maps/search/?${params.toString()}`;
}
