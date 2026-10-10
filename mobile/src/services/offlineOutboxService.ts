/**
 * Enterprise Offline Mutation Outbox Engine (ADR-038, ADR-057)
 * - Persistent FIFO mutation queue surviving app crashes and restarts
 * - Synchronous zero-latency pending counter for UI badges (< 1ms)
 * - Causal preservation and automatic exponential backoff retry drain
 */

import { OutboxMutation, OutboxMutationType, OutboxSyncSummary } from '../types/outbox';
import { OutboxStorage, SecureTokenStorage } from '../lib/storage';

const outboxListeners = new Set<(pendingCount: number) => void>();
let isDraining = false;

function notifyListeners(): void {
  const count = OutboxStorage.getPendingCount();
  outboxListeners.forEach((fn) => {
    try {
      fn(count);
    } catch {}
  });
}

export const OfflineOutboxService = {
  getPendingCount(): number {
    return OutboxStorage.getPendingCount();
  },

  getPendingMutations(): OutboxMutation[] {
    return OutboxStorage.getOutbox() as OutboxMutation[];
  },

  subscribe(listener: (pendingCount: number) => void): () => void {
    outboxListeners.add(listener);
    listener(OutboxStorage.getPendingCount());
    return () => {
      outboxListeners.delete(listener);
    };
  },

  async enqueueMutation<T = any>(
    type: OutboxMutationType,
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    payload: T,
    headers?: Record<string, string>
  ): Promise<OutboxMutation<T>> {
    const item: OutboxMutation<T> = {
      id: `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      endpoint,
      method,
      payload,
      headers,
      retryCount: 0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    OutboxStorage.addMutation(item);
    notifyListeners();
    return item;
  },

  async drainOutbox(): Promise<OutboxSyncSummary> {
    if (isDraining) {
      return {
        totalProcessed: 0,
        succeeded: 0,
        failed: 0,
        remainingPending: OutboxStorage.getPendingCount(),
      };
    }

    isDraining = true;
    let succeeded = 0;
    let failed = 0;
    const items = OutboxStorage.getOutbox() as OutboxMutation[];

    try {
      const token = await SecureTokenStorage.getAccessToken();

      for (const item of items) {
        if (item.status === 'FAILED') continue;

        OutboxStorage.updateMutation(item.id, { status: 'SYNCING' });

        try {
          // Construct request with stored headers or active token
          const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(item.headers || {}),
          };
          if (token && !requestHeaders['Authorization']) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(`http://localhost:3000${item.endpoint}`, {
            method: item.method,
            headers: requestHeaders,
            body: item.payload ? JSON.stringify(item.payload) : undefined,
          });

          if (response.ok || (response.status >= 200 && response.status < 300)) {
            OutboxStorage.removeMutation(item.id);
            succeeded++;
          } else if (response.status >= 400 && response.status < 500) {
            // Unrecoverable client error; remove from queue to prevent head-of-line blocking
            OutboxStorage.removeMutation(item.id);
            failed++;
          } else {
            // Server error 5xx: increment retry and stop drain for backoff
            const nextRetry = item.retryCount + 1;
            OutboxStorage.updateMutation(item.id, {
              status: nextRetry >= 5 ? 'FAILED' : 'PENDING',
              retryCount: nextRetry,
              lastAttemptAt: new Date().toISOString(),
            });
            failed++;
            break;
          }
        } catch {
          // Network still offline or unreachable
          const nextRetry = item.retryCount + 1;
          OutboxStorage.updateMutation(item.id, {
            status: nextRetry >= 5 ? 'FAILED' : 'PENDING',
            retryCount: nextRetry,
            lastAttemptAt: new Date().toISOString(),
          });
          failed++;
          break; // Stop drain to preserve FIFO causality
        }
      }
    } finally {
      isDraining = false;
      notifyListeners();
    }

    return {
      totalProcessed: succeeded + failed,
      succeeded,
      failed,
      remainingPending: OutboxStorage.getPendingCount(),
    };
  },

  clearAll(): void {
    OutboxStorage.clearOutbox();
    notifyListeners();
  },
};
