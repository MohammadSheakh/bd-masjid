# ADR-004: Prayer Schedule Temporal Modeling and Atomic History Snapshots

## Status
**Accepted**

## Date
2026-09-28

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In Bangladesh and Muslim communities globally, each daily prayer has two distinct times:
1. **Waqt Start Time**: The astronomical time when the prayer period begins (e.g., Fajr start at dawn).
2. **Jamaat (Congregational) Time**: The fixed clock time when the congregation stands together behind the Imam (e.g., Fajr Jamaat at 05:15 AM).

Traditional applications often conflate these into a single "prayer time", confusing users seeking congregational prayer. Furthermore, mosque committees change Jamaat times seasonally (e.g. Asr shifting across winter/summer), requiring transparency into who updated the schedule and when.

## Decision
1. **Explicit Start vs Jamaat Separation**:
   - `PrayerSchedule` model stores both `*Start` and `*Jamaat` for each of the five daily prayers (`fajr`, `zuhr`, `asr`, `maghrib`, `isha`), alongside special prayers (`jumuahJamaat`, `jumuahSecondJamaat`, `taraweehJamaat`, `sahriEnd`, `iftarStart`).
2. **Fixed Time Format & Timezone**:
   - Stored in strict 24-hour military clock string format (`HH:mm`, regex `^([01]\d|2[03]):[0-5]\d$`).
   - Standard timezone defaulted to `Asia/Dhaka` to eliminate daylight-savings/UTC day-boundary conversion bugs.
3. **Atomic Current + History Update**:
   - Any modification to a mosque's prayer schedule must execute within a database transaction (`prisma.$transaction`).
   - The active record in `PrayerSchedule` is updated, and an immutable snapshot is simultaneously inserted into `PrayerScheduleHistory` recording the full previous JSON state, `changedById`, and timestamp.
4. **Derived Freshness**:
   - Client and API calculate schedule freshness from `updatedAt`. If older than a threshold (e.g., 60 days), the UI renders an "Information may need verification" badge.

## Consequences

### Positive
- **Clarity for Musallis**: Users see exactly when Jamaat starts vs when the prayer window opens.
- **Auditability and Dispute Resolution**: Prevents vandalism and enables moderators to inspect historical changes or revert incorrect times.
- **Atomic Reliability**: Zero risk of partial schedule updates where current schedule is modified but history is lost.

### Tradeoffs & Mitigations
- **History Table Growth**: High update frequency could accumulate many history rows.
  - *Mitigation*: Seasonal updates typically occur 4-12 times a year per mosque, resulting in minimal storage overhead easily handled by standard PostgreSQL indexes.

## References
- Data & API Contracts: `_doc/mosque-platform-production-docs/03-DATA-API-CONTRACTS.md`
- Prayer Schedule Service: `backend-nest-prisma/src/features/prayer-schedules/prayer-schedules.service.ts`
