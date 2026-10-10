# ADR-035: Mobile Community Attendance Affiliation, Dual-Count Transparency, and Optimistic Sync Architecture

## Status
Accepted

## Date
2026-10-10

## Context
ADR-024 defined the platform-wide domain model for mosque community attendance: an enduring, one-time community affiliation declaration rather than a daily check-in. The platform records dual congregation metrics: `REGULAR` attendees (home/primary congregation) and `OCCASIONAL` attendees (visiting musallis), with both numbers exposed transparently to worshippers.

For the cross-platform mobile client (`mobile-app-expo`), attendance interaction requires:
1. **Sub-Millisecond UI Latency**: Tapping an affiliation toggle must immediately reflect the updated selection and update aggregate counts in place without waiting for round-trip cellular network latency.
2. **Offline Durability**: Worshipper selections must persist in local storage (`PreferencesStorage`) across app cold starts and survive offline periods.
3. **Dual Metric Surface Parity**: Both `MosqueDetailSheet` and virtualized `MosqueCard` must display `{regularCount} regular • {occasionalCount} occasional` to communicate community vitality clearly.

## Decision

1. **Tri-State Affiliation Lifecycle (`REGULAR` | `OCCASIONAL` | `NONE`)**:
   - The user can select either `I pray here regularly` (`REGULAR`) or `Occasional attendee` (`OCCASIONAL`).
   - Tapping the currently active option deselects it, transitioning the user state to `NONE`.
   - UI incorporates microcopy: *"Enduring community affiliation, not a daily check-in."*

2. **Optimistic Local Update with Reversible Delta**:
   - On tap, the component recalculates local regular and occasional counters immediately:
     - If switching from `NONE` to `REGULAR`: `regularCount + 1`.
     - If switching from `NONE` to `OCCASIONAL`: `occasionalCount + 1`.
     - If switching from `REGULAR` to `OCCASIONAL`: `regularCount - 1`, `occasionalCount + 1`.
     - If toggling off to `NONE`: decrements the respective previous category.
   - Synchronously persists user choice to `PreferencesStorage` (`bd_masjid_attendance_<mosqueId>`).
   - Asynchronously dispatches `ApiClient.setAttendance(mosqueId, status)` via `PUT /mosques/:id/attendance` or `DELETE /mosques/:id/attendance`.

3. **Ferio Visual Aesthetics**:
   - Active `REGULAR` badge: Emerald (`#059669`) pill with white typography.
   - Active `OCCASIONAL` badge: Primary Dark Neutral (`#111114`) pill with white typography.
   - Inactive badges: Neutral background (`#f4f4f5`) with border (`#e8e8ea`) and muted text (`#6e6e73`).
   - Compact dual-count badge in `MosqueCard` meta-row: `👥 {regularCount} regular • {occasionalCount} occasional`.

## Consequences

### Positive
- **Instant Responsiveness**: 0-latency UI update prevents stutter during bottom sheet interactions.
- **Resilient Offline Flow**: Affiliation is remembered locally even on spotty 3G/4G connections.
- **Domain Invariant Preservation**: Complete parity with NestJS backend `AttendanceModule` and ADR-024.

### Trade-offs
- An optimistic counter increment may briefly diverge from server state if a concurrent device unmarks attendance, but synchronizes smoothly on subsequent feed refreshes.
