/**
 * Community Moderation Domain Models (ADR-006, ADR-020, ADR-058)
 */

export type ModerationType = 'MOSQUE_VERIFICATION' | 'ISSUE_REPORT' | 'DUPLICATE_FLAG';

export type ModerationAction = 'APPROVE' | 'REJECT' | 'ESCALATE';

export interface ModerationQueueItem {
  id: string;
  type: ModerationType;
  targetId: string;
  targetName: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  distanceMeters?: number;
  duplicateWith?: string;
  details: string;
  contributorName: string;
  contributorRole: string;
  createdAt: string;
  status: 'PENDING' | 'RESOLVED';
}

export interface ResolveModerationPayload {
  action: ModerationAction;
  notes?: string;
}
