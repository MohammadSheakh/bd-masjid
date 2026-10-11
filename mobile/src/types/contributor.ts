/**
 * Contributor Activity and Scout Reputation Domain Models (ADR-003, ADR-054, ADR-060)
 */

export type ScoutTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'MASTER';

export type ContributorActivityType =
  | 'MOSQUE_CREATED'
  | 'SCHEDULE_UPDATED'
  | 'FACILITY_SUGGESTED'
  | 'REPORT_SUBMITTED';

export interface ContributorReputationSummary {
  userId: string;
  scoutPoints: number;
  scoutTier: ScoutTier;
  verifiedMosquesCount: number;
  scheduleUpdatesCount: number;
  facilitySuggestionsCount: number;
  issueReportsCount: number;
  rankTitle: string;
  nextTierPoints: number;
}

export interface ContributorActivityItem {
  id: string;
  type: ContributorActivityType;
  targetName: string;
  location: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  pointsEarned: number;
  createdAt: string;
}
