# ADR-024: One-Time Community Attendance Affiliation and Dual Count Transparency

## Status
Accepted

## Date
2026-10-03

## Context
Mosque attendance tracking was originally designed with `REGULAR` and `OCCASIONAL` statuses, but user feedback revealed confusion regarding its usage model:
1. **Misconception of Daily Check-in**: Some worshippers mistakenly thought attendance was a daily or per-prayer action, rather than an enduring community affiliation.
2. **Missing Occasional Count**: The UI primarily highlighted "regular attendees", hiding the count of occasional attendees despite the backend tracking both metrics.
3. **Card & Search Visibility Gap**: Mosque cards rendered from spatial nearby queries (`findNearby`) did not aggregate attendance counts, leaving card badges blank or defaulting to placeholder counts.

## Decision
We establish a **One-Time Enduring Community Affiliation Model with Dual-Metric Transparency**:

1. **One-Time Affiliation Declaration**:
   - Community attendance is defined as an enduring, one-time declaration of a worshipper's relationship with a mosque.
   - A worshipper selects **one of two options**:
     - `I pray here regularly` (`REGULAR`)
     - `Occasional attendee` (`OCCASIONAL`)
   - Selecting an option saves the affiliation. Clicking the active selection toggles it off (`NONE`), or clicking the alternative switches affiliation directly.
   - Clear UI micro-copy clarifies that this is a persistent community declaration rather than a daily check-in.

2. **Dual-Metric Transparency on All Mosque Surfaces**:
   - Every mosque presentation surface MUST show both metrics:
     - **Mosque Detail Modal**: Header displays live dual metrics: `{regularCount} regular • {occasionalCount} occasional`.
     - **Mosque List Cards (`MosqueCard`)**: Displays dual badge: `{regularCount} regular • {occasionalCount} occasional`.
     - **Standalone Mosque Page (`/mosques/[id]`)**: Displays `{regularCount} Regular • {occasionalCount} Occasional Attendees`.

3. **Backend Spatial Query Aggregation**:
   - `findNearby` and `findAll` in `MosquesService` batch-aggregate `UserMosqueAttendance` via `groupBy(['mosqueId', 'status'])` to populate `attendanceSummary` efficiently across all listed cards in a single database round-trip.

4. **Client-Side Parity & Offline Resilience**:
   - Authenticated sessions synchronize with `PUT /mosques/:id/attendance` using Bearer tokens.
   - Anonymous visitors retain their declaration in local storage (`bd_masjid_attendance_<id>`) and see immediate optimistic count increments.

## Consequences

### Positive
- **Clear User Expectation**: Worshippers understand the action as an ongoing declaration of their home/frequent mosque vs occasional venue.
- **Accurate Community Vitality**: Shows the true breadth of community participation (both core congregation and visiting musallis).
- **High Performance**: Batch grouping in backend queries avoids N+1 queries during nearby feeds.

### Negative / Trade-offs
- Adding `groupBy` to list endpoints adds a single database query per search/nearby request, which is fully covered by composite index on `(mosqueId, status)`.
