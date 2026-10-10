/**
 * Live GPS Proximity Radar Domain Models (ADR-063)
 */

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface ProximityDistanceInfo {
  distanceMeters: number;
  formattedBangla: string;
  formattedEnglish: string;
  isWalkingDistance: boolean; // <= 800m
}

export type ProximitySortMode = 'DEFAULT' | 'NEAREST';
