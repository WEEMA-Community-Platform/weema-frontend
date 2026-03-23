export type LatLng = { lat: number; lng: number } | null;

/**
 * Extract latitude/longitude from Google Maps or Apple Maps share URLs.
 * Falls back to the first decimal lat,lng pair in the string.
 */
export function extractLatLngFromMapsUrl(url: string): LatLng {
  if (!url) return null;

  try {
    const decoded = decodeURIComponent(url);

    // 1. Apple Maps: ?ll=lat,lng
    let match = decoded.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return toLatLng(match);

    // 2. Google Maps: ?q=lat,lng
    match = decoded.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return toLatLng(match);

    // 3. Google Maps: /place/lat,lng
    match = decoded.match(/\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return toLatLng(match);

    // 4. Google Maps: @lat,lng
    match = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return toLatLng(match);

    // 5. Google Maps data params: !3d(lat)!4d(lng)
    const latMatch = decoded.match(/!3d(-?\d+\.\d+)/);
    const lngMatch = decoded.match(/!4d(-?\d+\.\d+)/);
    if (latMatch && lngMatch) {
      return {
        lat: parseFloat(latMatch[1]),
        lng: parseFloat(lngMatch[1]),
      };
    }

    // 6. Fallback: first lat,lng pair in string
    match = decoded.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return toLatLng(match);

    return null;
  } catch {
    return null;
  }
}

function toLatLng(match: RegExpMatchArray): { lat: number; lng: number } {
  return {
    lat: parseFloat(match[1]),
    lng: parseFloat(match[2]),
  };
}
