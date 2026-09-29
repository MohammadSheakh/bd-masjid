/**
 * Reverse Geocoding Utility for BD Masjid Platform
 * Translates geographic coordinates (lat, lng) into human-readable place names,
 * street addresses, landmarks, and city details.
 */

export interface ReverseGeocodeResult {
  displayName: string;
  placeName: string;
  road: string;
  suburb: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  formattedAddress: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6733/api/v1';

/**
 * Reverse geocode coordinates to street address, place name, and city.
 * Queries the platform backend cache first, with resilient fallback directly
 * to OpenStreetMap Nominatim.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  // Validate coordinates
  if (
    isNaN(lat) ||
    isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return getEmptyResult();
  }

  // 1. Try platform backend endpoint (includes caching & rate-limit guard)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `${API_BASE}/mosques/reverse-geocode?latitude=${lat}&longitude=${lng}`,
      {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      if (data && (data.road || data.suburb || data.city || data.displayName)) {
        return {
          displayName: data.displayName || '',
          placeName: data.placeName || '',
          road: data.road || '',
          suburb: data.suburb || '',
          city: data.city || 'Dhaka',
          state: data.state || '',
          postcode: data.postcode || '',
          country: data.country || 'Bangladesh',
          formattedAddress: data.formattedAddress || data.displayName || '',
        };
      }
    }
  } catch {
    // Continue to client-side fallback
  }

  // 2. Client-side fallback directly to OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en,bn`,
      {
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const road =
        addr.road || addr.pedestrian || addr.highway || addr.path || '';
      const suburb =
        addr.suburb ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.residential ||
        '';
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.state_district ||
        addr.county ||
        'Dhaka';
      const state = addr.state || '';
      const postcode = addr.postcode || '';
      const country = addr.country || 'Bangladesh';
      const placeName = data.name || addr.amenity || addr.building || '';

      const parts = [road, suburb, city].filter(Boolean);
      const formattedAddress =
        parts.length > 0 ? parts.join(', ') : data.display_name || '';

      return {
        displayName: data.display_name || formattedAddress,
        placeName,
        road,
        suburb,
        city,
        state,
        postcode,
        country,
        formattedAddress,
      };
    }
  } catch (err) {
    console.warn('Direct Nominatim reverse geocode fallback failed:', err);
  }

  return getEmptyResult(lat, lng);
}

function getEmptyResult(lat?: number, lng?: number): ReverseGeocodeResult {
  return {
    displayName:
      lat !== undefined && lng !== undefined
        ? `Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`
        : '',
    placeName: '',
    road: '',
    suburb: '',
    city: 'Dhaka',
    state: '',
    postcode: '',
    country: 'Bangladesh',
    formattedAddress: '',
  };
}
