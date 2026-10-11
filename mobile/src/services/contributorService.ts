/**
 * Contributor Activity and Scout Reputation Service (ADR-003, ADR-054, ADR-060)
 * - Synchronous UI access to scout reputation and points (< 1ms latency)
 * - Optimistic points accrual and tier progression
 * - Pub/Sub event dispatcher for reactive profile updates
 */

import { ApiClient } from '../lib/apiClient';
import { AuthService } from './authService';
import { ContributorActivityItem, ContributorReputationSummary, ScoutTier } from '../types/contributor';

let cachedSummary: ContributorReputationSummary = {
  userId: 'usr-scout-dhaka',
  scoutPoints: 450,
  scoutTier: 'GOLD',
  verifiedMosquesCount: 12,
  scheduleUpdatesCount: 34,
  facilitySuggestionsCount: 19,
  issueReportsCount: 7,
  rankTitle: 'Chief Musalli Scout (ঢাকা)',
  nextTierPoints: 600,
};

let cachedActivity: ContributorActivityItem[] = [];
let hasFetched = false;
const listeners = new Set<(summary: ContributorReputationSummary) => void>();

function notifyListeners(): void {
  listeners.forEach((fn) => {
    try {
      fn({ ...cachedSummary });
    } catch {}
  });
}

function calculateTier(points: number): { tier: ScoutTier; nextPoints: number } {
  if (points >= 1000) return { tier: 'MASTER', nextPoints: 1000 };
  if (points >= 400) return { tier: 'GOLD', nextPoints: 1000 };
  if (points >= 150) return { tier: 'SILVER', nextPoints: 400 };
  return { tier: 'BRONZE', nextPoints: 150 };
}

export const ContributorService = {
  getReputationSync(): ContributorReputationSummary {
    const user = AuthService.getUserSync();
    if (user && cachedSummary.userId !== user.id) {
      cachedSummary.userId = user.id;
    }
    return { ...cachedSummary };
  },

  getScoutPointsSync(): number {
    return cachedSummary.scoutPoints;
  },

  getScoutTierSync(): ScoutTier {
    return cachedSummary.scoutTier;
  },

  getActivityHistorySync(): ContributorActivityItem[] {
    return [...cachedActivity];
  },

  subscribe(listener: (summary: ContributorReputationSummary) => void): () => void {
    listeners.add(listener);
    listener({ ...cachedSummary });
    return () => {
      listeners.delete(listener);
    };
  },

  async loadReputation(): Promise<ContributorReputationSummary> {
    const user = AuthService.getUserSync();
    const summary = await ApiClient.fetchContributorReputation(user?.id);
    const activity = await ApiClient.fetchContributorHistory(user?.id);
    cachedSummary = summary;
    cachedActivity = activity;
    hasFetched = true;
    notifyListeners();
    return summary;
  },

  awardOptimisticPoints(points: number, reason: string): void {
    cachedSummary.scoutPoints += points;
    const { tier, nextPoints } = calculateTier(cachedSummary.scoutPoints);
    cachedSummary.scoutTier = tier;
    cachedSummary.nextTierPoints = nextPoints;
    cachedActivity = [
      {
        id: `opt-${Date.now()}`,
        type: 'MOSQUE_CREATED',
        targetName: reason,
        location: 'Local submission',
        status: 'PENDING',
        pointsEarned: points,
        createdAt: new Date().toISOString(),
      },
      ...cachedActivity,
    ];
    notifyListeners();
  },
};
