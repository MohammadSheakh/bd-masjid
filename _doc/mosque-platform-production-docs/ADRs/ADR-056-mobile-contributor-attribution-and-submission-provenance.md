# ADR-056: Mobile Contributor Attribution and Submission Provenance Across Crowdsourced Sheets

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-006, ADR-020, ADR-021, and ADR-043, the platform established a crowdsourced, community-first data model for mosques, prayer schedules, facility amenities, and issue reports.

With the introduction of Phase 19 (`AuthService`, ADR-054), worshippers can authenticate as verified contributors or platform scouts. However, the mobile submission sheets:
1. `AddMosqueSheet.tsx` (Pin-drop and new mosque registration)
2. `TimetableUpdateModal.tsx` (Immediate community prayer timetable adjustments)
3. `ReportIssueModal.tsx` (Listing error reporting and delisting protection)
4. `SuggestFacilitiesModal.tsx` (Extensible facilities taxonomy suggestions)

were previously submitting anonymously without reflecting the user's logged-in identity or passing contributor provenance (`contributorId`, `userId`, `reporterEmail`) to the backend NestJS controllers.

Furthermore, unauthenticated worshippers had no visibility that logging in would associate their submissions with their profile or build scout credibility, and they lacked a frictionless way to authenticate without losing in-progress form inputs.

---

## Decision

### 1. Reusable Ferio Contributor Attribution Component (`ContributorAttributionBanner.tsx`)
We introduce a lightweight, high-contrast Ferio component rendered at the top of all crowdsourced submission sheets:
- **Synchronous Zero-Latency Hydration**: Reads current session synchronously via `AuthService.getUserSync()` with reactive updates via `AuthService.addListener()`.
- **Authenticated State**:
  - Emerald badge (`#059669` / `#ecfdf5`), verified checkmark icon.
  - Musalli name and role badge (e.g., `Mohammad (Verified Scout)`).
  - Clear label: `"Submitting with authenticated contributor provenance"`.
- **Guest / Anonymous State**:
  - Neutral high-contrast pill (`#f4f4f5` / `#71717a`).
  - Label: `"Submitting anonymously as Musalli"`.
  - Secondary 1-tap action: `"Sign in to track submission & earn scout reputation"` which opens `AuthSessionModal` while preserving modal draft states.

### 2. Integration into Crowdsourced Input Sheets
- **`AddMosqueSheet.tsx`**: Renders `ContributorAttributionBanner` below the modal title. Attaches `contributorId` and `contributorName` to the submission payload sent to `POST /mosques`.
- **`TimetableUpdateModal.tsx`**: Renders `ContributorAttributionBanner` above the prayer time inputs. Attaches `updatedBy` provenance to the timetable payload.
- **`SuggestFacilitiesModal.tsx`**: Renders `ContributorAttributionBanner` above the facility toggle grid. Attaches `contributorId` to `POST /mosques/:id/suggestions`.
- **`ReportIssueModal.tsx`**: Renders `ContributorAttributionBanner` above category selector. Pre-fills reporter contact email and attaches `userId` if authenticated.

### 3. Preserving Low-Friction Community Participation
In strict accordance with ADR-020 and ADR-021, unauthenticated users are never blocked from submitting. Community contributions remain open to all musallis, while authenticated submissions receive higher provenance ranking in moderation queues.

---

## Consequences

### Positive
- Submissions across all sheets automatically link to user accounts on the backend.
- Contributors receive visual affirmation of their identity and scout role.
- Increased registration conversion by demonstrating tangible value (scout reputation) at high-intent moments of contribution.
- Zero latency impact ($<0.1$ms) due to synchronous memory cache in `AuthService`.

### Negative / Trade-offs
- Adds a compact ~44px banner to modal viewports; mitigated by tight Ferio spacing and compact layout.
