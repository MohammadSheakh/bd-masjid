# ADR-068: Mobile Prayer Schedule Revision History and Audit Timeline Sheet

## Status
Accepted

## Date
2026-10-10

## Context
Accurate prayer and jammat timetables are central to the BD Masjid platform. Because schedules change seasonally (winter/summer shifts) and during special religious periods, timetable updates are recorded into an immutable audit snapshot log in PostgreSQL/PostGIS. 

The backend exposes an existing paginated change history endpoint:
- `GET /api/v1/mosques/:id/prayer-schedule/history?page=1&limit=20` (in `PrayerSchedulesController`, ADR-004, ADR-021, ADR-026, `F-004`)
- Returns `items`: `Array<{ id, mosqueId, scheduleSnapshot, changedById, changedBy: { id, name }, reason, createdAt }>` along with pagination metadata.

Previously on mobile, users could only view the currently active schedule and submit a proposed update. Musallis and mosque leaders could not see when the schedule was last updated, who modified it, what previous jammat timings were, or what specific waqt times changed.

The mobile client requires a Ferio-styled **Prayer Schedule Revision History Sheet (`PrayerScheduleAuditModal.tsx`)** allowing musallis to inspect chronological audit records, view visual diff badges highlighting time deltas (e.g. `+15m`, `5:15 -> 5:30`), check editor attribution, and report discrepancies.

## Decision
We implement the Prayer Schedule Revision History and Audit Timeline workflow adhering to:

1. **Domain Contracts & ApiClient Transport (`types/prayerScheduleAudit.ts`)**:
   - `PrayerScheduleSnapshot`: snapshot of all waqt start and jammat times, effective date, and freshness.
   - `PrayerScheduleHistoryItem`: audit record containing id, snapshot, changedBy, reason, createdAt.
   - `ApiClient.getPrayerScheduleHistory(mosqueId: string, page?: number, limit?: number)` calling `GET /api/v1/mosques/:id/prayer-schedule/history`.
2. **Visual Diff Highlighting Engine (`lib/scheduleDiff.ts`)**:
   - Compares successive timetable snapshots to compute waqt-level deltas in minutes.
   - Computes badge formatting (`+15m` in amber/emerald, `-10m`, or `No change`).
3. **Ferio Visual Aesthetics (`PrayerScheduleAuditModal.tsx`)**:
   - Clean timeline cards with date tags (`DD MMM YYYY`), author badge (`Verified Lead` / `Community Contributor`), and optional reason text.
   - Waqt badges with visual diffs (e.g. `Fajr: 05:15 -> 05:30 (+15m)`).
   - "Report Discrepancy" action button linking to `ReportIssueModal`.
4. **Integration Point**:
   - Accessible via "🕒 History / ইতিহাস" link on the Timetable Card within `MosqueDetailSheet.tsx`.

## Consequences
- **Positive**: Complete transparency and accountability for community timetable modifications.
- **Positive**: Musallis can verify seasonal shift authenticity before arriving for congregation.
- **Positive**: Directly consumes existing NestJS `GET /api/v1/mosques/:id/prayer-schedule/history` endpoint without backend changes.
