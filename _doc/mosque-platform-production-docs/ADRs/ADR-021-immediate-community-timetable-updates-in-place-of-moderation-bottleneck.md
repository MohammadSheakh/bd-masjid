# ADR-021: Immediate Community Timetable Updates in Place of Suggestion Review Bottleneck

## Status
Accepted

## Date
2026-10-03

## Context
Mosque congregational prayer (Jamaat) times in Bangladesh change frequently across seasons (e.g., winter vs. summer daylight shifts) and local mosque committee decisions. 

Previously, the platform routed community timetable adjustments through a two-stage suggestion workflow (`MosqueSuggestion` with status `OPEN`). Timetable changes remained invisible to worshippers until a platform administrator logged into the Enterprise Admin Console and manually clicked "Apply & Resolve". Furthermore, `PUT /api/v1/mosques/:id/prayer-schedule` was restricted to administrators, moderators, or verified staff members (`ForbiddenException`).

In practice, this caused critical operational issues:
1. **Stale Jamaat Times**: Centralized admins cannot keep up with thousands of neighborhood mosques across 64 districts in real time. Musallis arriving at mosques missed Jamaat prayers due to stale schedules waiting in an admin backlog.
2. **Artificial Administrative Bottleneck**: Administrators spent time manually reviewing routine time changes rather than focusing on spam and abuse moderation.
3. **Inconsistent Trust Model**: While general mosque listing moved to an open, sovereign listing model (`ADR-020`), prayer schedules remained gated behind manual approval. Like OpenStreetMap and Wikipedia, crowdsourced operational data thrives on immediate self-healing edits backed by immutable history logs.

## Decision
We replace the gated timetable suggestion queue with **Immediate Community Timetable Updates**:

1. **Direct Persistence (`PUT /api/v1/mosques/:id/prayer-schedule`)**:
   - Any community member (authenticated user, or public visitor subject to rate limiting) can update a mosque's congregational Jamaat times directly.
   - The update immediately persists to the active `PrayerSchedule` record and refreshes the freshness status to `FRESH`.
   - The mosque's `updatedAt` timestamp is touched to reflect recent community activity.

2. **Atomic Revision History (`PrayerScheduleHistory`)**:
   - Every timetable update is wrapped in a database transaction (`prisma.$transaction`) that atomically updates `PrayerSchedule` and appends an immutable snapshot to `PrayerScheduleHistory`.
   - The snapshot captures `changedById` (nullable for anonymous edits), optional community change notes (`reason`), and the timestamp.

3. **Spam & Abuse Defense**:
   - Endpoints are protected by `SlidingWindowRateLimitGuard` (15 requests/minute per IP/user) and strict regex validation (`^([01]\d|2[03]):[0-5]\d$`).
   - If an incorrect time is entered, any community member can immediately correct it, or submit an issue report (`MosqueReport` with type `PRAYER_TIME`).
   - Platform administrators retain full visibility through `PrayerScheduleHistory` and can revert or adjust times if needed.

4. **Decommissioning the Approval Bottleneck**:
   - The frontend modal is renamed from "Suggest Timetable Change" to "Update Prayer Timetable" with instant submission.
   - Ramadan schedules/timetables are removed from the standard update modal per platform scope.
   - Backward-compatibility: `POST /api/v1/mosques/:id/suggestions` with `suggestedTimes` automatically applies the times directly to `PrayerSchedule` and marks the suggestion `RESOLVED`.

## Consequences

### Positive
- **Real-Time Accuracy**: Jamaat times reflect the latest committee announcements immediately.
- **Zero Administrative Latency**: Eliminates the backlog of pending timetable suggestions.
- **Full Traceability**: Immutable `PrayerScheduleHistory` snapshots provide complete historical auditability.

### Negative / Trade-offs
- Risk of erroneous community edits, mitigated by rate limiting, validation, community self-healing, and audit history.
