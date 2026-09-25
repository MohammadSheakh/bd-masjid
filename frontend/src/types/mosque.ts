export type MosqueOperationalStatus =
  | 'OPEN'
  | 'TEMPORARILY_CLOSED'
  | 'PERMANENTLY_CLOSED'
  | 'UNDER_CONSTRUCTION'
  | 'UNKNOWN';

export type MosqueVerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED';

export type FreshnessLevel = 'FRESH' | 'STALE' | 'VERY_STALE';

export interface FreshnessMetadata {
  level: FreshnessLevel;
  daysAgo: number;
  lastUpdated: string | null;
}

export interface PrayerSchedule {
  id?: string;
  mosqueId?: string;
  fajrStart?: string | null;
  fajrJamaat?: string | null;
  sunrise?: string | null;
  zuhrStart?: string | null;
  zuhrJamaat?: string | null;
  asrStart?: string | null;
  asrJamaat?: string | null;
  maghribStart?: string | null;
  maghribJamaat?: string | null;
  ishaStart?: string | null;
  ishaJamaat?: string | null;
  jumuahJamaat?: string | null;
  timezone?: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'REGULAR' | 'OCCASIONAL' | 'NONE';

export interface AttendanceSummary {
  regularCount: number;
  occasionalCount: number;
  totalCount?: number;
  userStatus: AttendanceStatus;
}

export interface Mosque {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  landmark?: string | null;
  city?: string | null;
  country?: string;
  operationalStatus: MosqueOperationalStatus;
  verificationStatus: MosqueVerificationStatus;
  distanceMeters?: number;
  prayerSchedule?: PrayerSchedule | null;
  freshness?: FreshnessMetadata;
  attendanceSummary?: AttendanceSummary;
  createdAt?: string;
  updatedAt?: string;
}

export interface DuplicateCandidate {
  mosqueId: string;
  name: string;
  distanceMeters: number;
}
