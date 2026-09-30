# Project Current Status & Roadmap

## Current Phase: Releases 1, 2, & 3 Completed & Hardened
Date: 2026-09-30

All primary Release 1 feature verticals, Release 2 governance & facilities verticals, and Release 3 donation & real-time notification verticals across both the NestJS backend and Next.js frontend are implemented, integrated, and verified.

---

## 1. Documentation & Architecture State
- **Implementation Checklist**: Checkmarked and audited against current codebase in [`06-IMPLEMENTATION-CHECKLIST.md`](06-IMPLEMENTATION-CHECKLIST.md).
- **Architecture Decision Records (ADRs)**: Recorded in [`ADRs/`](ADRs/README.md) (`ADR-001` through `ADR-013`).
- **Feature Specifications & Tickets**: Extracted feature-wise into [`specs/`](specs/README.md) (17 completed feature specifications).
  - Release 1: `F-001` to `F-012`
  - Release 2: `F-020` (Staff Delegation), `F-021` (Facilities Taxonomy), `F-022` (Announcements)
  - Release 3: `F-030` (Mosque Donations), `F-031` (Follows & Real-time Notifications)

---

## 2. Explicitly Excluded / Deferred Scope (AI Agent Notice)
> [!IMPORTANT]
> The following items are explicitly **excluded from the active roadmap and deferred indefinitely**:
> - **Volunteer Roster Coordination (`F-023`)**: Not needed.
> - **Multiple Jamaat Shifts / Timetables**: Standard single Jamaat per Waqt (`F-007`) is sufficient.
> - **Jumu'ah Special Schedule Tables**: Covered via standard prayer times and announcements.
> - **Ramadan Schedules & Timetables**: Handled via standard announcements (`F-022`).
> - **External Push Worker Daemons (BullMQ / Redis)**: Not needed; in-app notifications (`F-031`) suffice.
>
> AI agents MUST NOT suggest, propose, or initiate development tasks for the items above.

---

## 3. Test & Verification Baseline
- **Backend Test Suites**: Passing automated unit, service, controller, and gateway test suites (`npm test` in `backend-nest-prisma/`).
- **Backend Production Build**: Clean build (`npm run build` succeeds).
- **Frontend Production Build**: Clean Turbopack production build (`npm run build` succeeds).
- **Frontend Routes**: Home (`/`), Standalone Mosque Profile (`/mosques/[id]`), Admin Dashboard (`/admin`), Profile (`/profile`).

---

## 4. Immediate Next Milestones
1. **Automated CI/CD Integration**:
   - Disposable PostgreSQL + PostGIS test container in GitHub Actions workflow.
   - Database migration replay check (`prisma migrate deploy`).
2. **Browser End-to-End Testing**:
   - Playwright automated smoke suite covering the full user flow (Pin-drop creation -> Search -> Profile inspection -> Suggestion submission -> Admin verification -> Follow & Notification).
3. **Staging Environment & Backup Drill**:
   - Automated `pg_dump` snapshot script, offsite upload, and restoration drill.
