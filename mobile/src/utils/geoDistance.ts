/**
 * Geodesic Haversine Distance Calculator & Formatters (ADR-063)
 */

import { GeoCoordinates, ProximityDistanceInfo } from '../types/proximity';
import { toBanglaDigits } from '../services/localizationService';

const EARTH_RADIUS_METERS = 6371000;

export function calculateHaversineDistance(
  origin: GeoCoordinates,
  target: GeoCoordinates
): number {
  const dLat = ((target.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((target.lng - origin.lng) * Math.PI) / 180;
  const lat1 = (origin.lat * Math.PI) / 180;
  const lat2 = (target.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

export function formatDistanceInfo(meters: number): ProximityDistanceInfo {
  let formattedEnglish: string;
  let formattedBangla: string;

  if (meters < 1000) {
    formattedEnglish = `${meters}m`;
    formattedBangla = `${toBanglaDigits(meters)} মি.`;
  } else {
    const km = (meters / 1000).toFixed(1);
    formattedEnglish = `${km} km`;
    formattedBangla = `${toBanglaDigits(km)} কি.মি.`;
  }

  return {
    distanceMeters: meters,
    formattedEnglish,
    formattedBangla,
    isWalkingDistance: meters <= 800,
  };
}
