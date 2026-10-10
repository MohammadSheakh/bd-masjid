# ADR-058: Mobile Community Moderator and Scout Review Sheet Architecture

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-006, ADR-019, ADR-020, and ADR-054, the platform established crowdsourced mosque submissions, delisting protection, and Role-Based Access Control (RBAC) with dedicated roles (`USER`, `CONTRIBUTOR`, `MODERATOR`, `ADMIN`).

While regular worshippers and scouts submit new mosques (`PENDING_VERIFICATION`), timetable updates, facility suggestions, and issue reports via mobile, triage and moderation previously required desktop administrative access. Trusted field scouts and community moderators traveling across Bangladesh need the ability to review and verify crowdsourced submissions directly on their mobile devices, especially when physically standing at the mosque to confirm coordinates and amenities.

---

## Decision

### 1. Role-Gated Moderation Domain Models (`types/moderation.ts`)
We introduce structured moderation contracts:
- `ModerationType`: `'MOSQUE_VERIFICATION' | 'ISSUE_REPORT' | 'DUPLICATE_FLAG'`.
- `ModerationAction`: `'APPROVE' | 'REJECT' | 'ESCALATE'`.
- `ModerationQueueItem`:
  - `id`: string
  - `type`: ModerationType
  - `targetId`: Mosque ID or Report ID
  - `targetName`: Mosque name or location
  - `details`: Details description, coordinates, or reported issue reason
  - `contributorName`: Scout attribution or anonymous submitter
  - `contributorRole`: UserRole
  - `createdAt`: ISO 8601 timestamp
  - `status`: `'PENDING' | 'RESOLVED'`.

### 2. Moderation Transport & Fallback in `ApiClient`
- `fetchModerationQueue(): Promise<ModerationQueueItem[]>`
  - Requires Bearer JWT with `MODERATOR` or `ADMIN` role.
  - In development/offline mode, returns structured Bangladeshi mock queue items (e.g. pending mosque in Uttara Sector 11, duplicate check in Dhanmondi 27).
- `resolveModerationItem(id: string, action: ModerationAction, notes?: string): Promise<{ success: boolean }>`

### 3. Dedicated `ModeratorService` (`moderatorService.ts`)
- Evaluates `AuthService.getUserSync()?.role`: Only activates when `role === 'MODERATOR' || role === 'ADMIN'`.
- Synchronous pending review count for navbar badge indicators.
- Optimistic queue item removal and action dispatch.

### 4. Ferio Moderator Review Modal (`ModeratorReviewModal.tsx`)
- High-contrast modal sheet strictly adhering to Ferio visual tokens:
  - Header: `🛡️ Community Moderator Console` with verified scout shield badge (`#059669` / `#ecfdf5`).
  - Category Filter Pills: `All`, `Mosques`, `Reports`, `Duplicates`.
  - Item Card:
    - Target mosque title and geographic location.
    - Contributor attribution pill with timestamp.
    - Quick actions:
      - Green `✓ Approve & List` (`#059669`).
      - Neutral red `✕ Reject / Delist` (`#dc2626`).
- Automatic real-time list updates upon resolution.

### 5. Navbar Integration in `App.tsx`
- Conditionally renders a high-contrast `🛡️ Mod (X)` pill in the top navbar only when the authenticated user possesses `MODERATOR` or `ADMIN` privileges.

---

## Consequences

### Positive
- Field scouts and mosque committee moderators can verify submissions on-site with zero delay.
- Clean role separation: Non-moderator worshippers incur 0kb visual overhead.
- Performance gate compliant: Zero memory overhead when unauthenticated or regular user.

### Negative / Trade-offs
- Adds one specialized moderation modal component (~150 lines); isolated in dedicated component file.
