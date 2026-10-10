/**
 * Enterprise Qibla Direction & Geodesic Calculation Service
 * Conforming to ADR-046
 * Calculates exact Great-Circle forward azimuth towards Kaaba, Mecca
 * (21.422487° N, 39.826206° E) from any device location in Bangladesh.
 */

export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
};

// Standard Bangladesh reference (Dhaka center)
export const BANGLADESH_DEFAULT_COORDS = {
  latitude: 23.8103,
  longitude: 90.4125,
};

export const QiblaService = {
  /**
   * Calculates the initial Great-Circle bearing towards Kaaba in degrees [0, 360)
   */
  calculateQiblaBearing(
    userLat: number = BANGLADESH_DEFAULT_COORDS.latitude,
    userLng: number = BANGLADESH_DEFAULT_COORDS.longitude
  ): number {
    const lat1 = (userLat * Math.PI) / 180;
    const lat2 = (KAABA_COORDINATES.latitude * Math.PI) / 180;
    const deltaLng = ((KAABA_COORDINATES.longitude - userLng) * Math.PI) / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    const initialBearingRad = Math.atan2(y, x);
    const initialBearingDeg = (initialBearingRad * 180) / Math.PI;

    // Normalize to [0, 360)
    return (initialBearingDeg + 360) % 360;
  },

  /**
   * Calculates Great-Circle distance to Kaaba in kilometers
   */
  calculateDistanceToKaabaKm(
    userLat: number = BANGLADESH_DEFAULT_COORDS.latitude,
    userLng: number = BANGLADESH_DEFAULT_COORDS.longitude
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((KAABA_COORDINATES.latitude - userLat) * Math.PI) / 180;
    const dLng = ((KAABA_COORDINATES.longitude - userLng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((KAABA_COORDINATES.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  },

  /**
   * Calculates relative needle offset angle to align pointer towards Kaaba
   */
  getRelativeKaabaAngle(deviceHeading: number, qiblaBearing: number): number {
    return (qiblaBearing - deviceHeading + 360) % 360;
  },

  /**
   * Checks if user device is directly facing Kaaba within tolerance
   */
  isQiblaAligned(
    deviceHeading: number,
    qiblaBearing: number,
    toleranceDegrees: number = 3.0
  ): boolean {
    const diff = Math.abs(deviceHeading - qiblaBearing);
    const minDiff = Math.min(diff, 360 - diff);
    return minDiff <= toleranceDegrees;
  },
};
