import { isValidMapCoordinate } from "./geo";
import type { Activity } from "./types";

/**
 * Opens Google Maps directions to the activity. Prefer place_id when available.
 * Falls back to a search query (name + trip destination) when coords are missing or 0,0.
 * @see https://developers.google.com/maps/documentation/urls/get-started
 */
export function getGoogleMapsDirectionsUrl(
  activity: Activity,
  tripDestination?: string,
): string {
  const { lat, lng, googlePlaceId } = activity.location;

  if (googlePlaceId?.trim()) {
    const params = new URLSearchParams({
      api: "1",
      destination: activity.name,
      destination_place_id: googlePlaceId.trim(),
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  if (isValidMapCoordinate(lat, lng)) {
    const params = new URLSearchParams({
      api: "1",
      destination: `${lat},${lng}`,
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  const query = [
    activity.name,
    activity.location.neighborhood?.trim(),
    tripDestination?.trim(),
  ]
    .filter(Boolean)
    .join(" ");
  const searchParams = new URLSearchParams({
    api: "1",
    query: query.trim() || activity.name,
  });
  return `https://www.google.com/maps/search/?${searchParams.toString()}`;
}
