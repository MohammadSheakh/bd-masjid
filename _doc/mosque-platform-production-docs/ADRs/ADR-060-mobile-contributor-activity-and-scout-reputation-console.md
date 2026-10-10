# ADR-060: Mobile Contributor Activity and Scout Reputation Console Architecture

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-003, ADR-006, ADR-020, and ADR-054, the platform established a crowdsourced community model where registered worshippers act as field scouts by dropping pins for new mosques, updating prayer times, and submitting facility improvements.

However, contributors previously lacked transparent visibility into:
1. Their accumulated Scout Reputation score and Contributor Tier (`Bronze`, `Silver`, `Gold`, `Master`).
2. The moderation lifecycle of their past submissions (whether a newly added mosque was approved by community moderators, pending review, or rejected).
3. How many verified timetable adjustments and facility improvements they have contributed to Bangladesh's national mosque registry.

To encourage high-fidelity crowdsourced submissions and reward community stewardship, mobile clients need a dedicated Contributor Activity & Scout Reputation Console.

---

## Decision

### 1. Scout Reputation Domain Contracts (`types/contributor.ts`)
We introduce structured contributor reputation models:
- `ScoutTier`: `'BRONZE' | 'SILVER' | 'GOLD' | 'MASTER'`.
- `ContributorReputationSummary`:
  - `userId`: string
  - `scoutPoints`: number
  - `scoutTier`: ScoutTier
  - `verifiedMosquesCount`: number
  - `scheduleUpdatesCount`: number
  - `facilitySuggestionsCount`: number
  - `issueReportsCount`: number
  - `rankTitle`: string (e.g. "Senior Field Scout")
- `ContributorActivityItem`:
  - `id`: string
  - `type`: `'MOSQUE_CREATED' | 'SCHEDULE_UPDATED' | 'FACILITY_SUGGESTED' | 'REPORT_SUBMITTED'`
  - `targetName`: string (e.g. "Baitun Noor Jame Masjid")
  - `location`: string
  - `status`: `'APPROVED' | 'PENDING' | 'REJECTED'`
  - `pointsEarned`: number
  - `createdAt`: ISO 8601 timestamp

### 2. Contributor Transport in `ApiClient`
- `fetchContributorReputation(): Promise<ContributorReputationSummary>`
- `fetchContributorHistory(): Promise<ContributorActivityItem[]>`
- Supported by realistic Bangladeshi fallback fixtures for offline/guest modes.

### 3. Dedicated `ContributorService` (`services/contributorService.ts`)
- Provides $<1$ms synchronous access to cached reputation and points.
- Automatically increments scout points optimistically when user completes a submission sheet.
- Pub/sub subscription for reactive profile updating.

### 4. Ferio Contributor Activity Sheet (`ContributorActivityModal.tsx`)
- High-contrast modal sheet strictly adhering to Ferio visual tokens:
  - Header: `🏅 Scout Reputation & Activity` with badge.
  - Score Card: Gold tier pill, total points, and progress towards next tier.
  - Breakdown grid: 4 stat boxes (Mosques, Timetables, Facilities, Reports).
  - Activity Feed: Filterable timeline showing each contribution with status badges (`✓ Approved`, `⏳ Pending`, `✕ Rejected`) and point bonuses (`+50 pts`).

### 5. Integration with Profile Session
- Embedded as an accessible primary action ("My Contributions & Scout Points →") within `AuthSessionModal.tsx` profile card.

---

## Consequences

### Positive
- Drives high contributor retention and gamified civic engagement for mosque data accuracy.
- Complete transparency on submission verification status.
- Zero latency impact on low-end hardware through in-memory caching.

### Negative / Trade-offs
- Adds one modal component (~150 lines); isolated in dedicated component file.
