/**
 * Offline Mutation Outbox Domain Models (ADR-038, ADR-057)
 * Ensures robust offline contribution queues across Bangladesh network conditions.
 */

export type OutboxMutationType =
  | 'ATTENDANCE'
  | 'TIMETABLE_UPDATE'
  | 'CREATE_MOSQUE'
  | 'SUGGEST_FACILITY'
  | 'REPORT_ISSUE';

export type OutboxItemStatus = 'PENDING' | 'SYNCING' | 'FAILED';

export interface OutboxMutation<T = any> {
  id: string;
  type: OutboxMutationType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: T;
  headers?: Record<string, string>;
  retryCount: number;
  status: OutboxItemStatus;
  createdAt: string;
  lastAttemptAt?: string;
  lastError?: string;
}

export interface OutboxSyncSummary {
  totalProcessed: number;
  succeeded: number;
  failed: number;
  remainingPending: number;
}
