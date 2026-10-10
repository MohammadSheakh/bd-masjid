/**
 * Domain contracts for Prayer Schedule Revision History and Audit Snapshots
 * Conforming to backend PrayerSchedulesController (ADR-004, ADR-026, ADR-068)
 */

export interface PrayerScheduleSnapshot {
  fajrStart?: string;
  fajrJamaat?: string;
  zuhrStart?: string;
  zuhrJamaat?: string;
  asrStart?: string;
  asrJamaat?: string;
  maghribStart?: string;
  maghribJamaat?: string;
  ishaStart?: string;
  ishaJamaat?: string;
  jumuahJamaat?: string;
  effectiveDate?: string;
  freshnessLevel?: 'HIGH' | 'MEDIUM' | 'STALE' | 'UNKNOWN';
}

export interface PrayerScheduleHistoryItem {
  id: string;
  mosqueId: string;
  scheduleSnapshot: PrayerScheduleSnapshot;
  changedById: string | null;
  changedBy: {
    id: string;
    name: string;
  } | null;
  reason: string | null;
  createdAt: string;
}

export interface PrayerScheduleHistoryResponse {
  items: PrayerScheduleHistoryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
