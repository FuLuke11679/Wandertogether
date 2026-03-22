/**
 * Parse lat/lng from API / persisted JSON (numbers or numeric strings).
 * Returns null if unusable.
 */
export function parseMapLatLng(
  lat: unknown,
  lng: unknown,
): { lat: number; lng: number } | null {
  const la = typeof lat === "number" ? lat : parseFloat(String(lat));
  const ln = typeof lng === "number" ? lng : parseFloat(String(lng));
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (Math.abs(la) < 1e-7 && Math.abs(ln) < 1e-7) return null;
  if (la < -85 || la > 85 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}

/** True if coordinates are usable for maps / routing (excludes null island and NaN). */
export function isValidMapCoordinate(lat: unknown, lng: unknown): boolean {
  return parseMapLatLng(lat, lng) !== null;
}
