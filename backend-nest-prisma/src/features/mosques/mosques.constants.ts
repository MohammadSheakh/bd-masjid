export const MOSQUE_CONSTANTS = {
  DEFAULT_NEARBY_RADIUS_METERS: 3000,
  MAX_NEARBY_RADIUS_METERS: 25000, // 25 km max
  MIN_NEARBY_RADIUS_METERS: 50,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DUPLICATE_CHECK_RADIUS_METERS: 50, // Warning threshold for nearby duplicates
  DEFAULT_COUNTRY: 'Bangladesh',
  DEFAULT_CITY: 'Dhaka',
  DEFAULT_TIMEZONE: 'Asia/Dhaka',
} as const;

export const FRESHNESS_THRESHOLDS_DAYS = {
  FRESH: 90,     // < 90 days: recent / fresh
  STALE: 180,    // 90-180 days: stale
  VERY_STALE: 180 // > 180 days: very stale
} as const;
