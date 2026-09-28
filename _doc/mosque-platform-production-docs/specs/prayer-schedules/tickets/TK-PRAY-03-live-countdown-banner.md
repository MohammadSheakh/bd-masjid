# TK-PRAY-03: Live Prayer Countdown & Display Banner

## Spec
Parent Spec: [prayer-schedules.md](../prayer-schedules.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Develop the live countdown timer banner and prayer schedule presentation on the frontend, displaying the current prayer window and exact countdown time to the next Jamaat.

## Acceptance Criteria
- [x] Component `PrayerCountdownBanner.tsx` embedded at top of home view.
- [x] Calculates nearest upcoming prayer based on local/Asia:Dhaka time.
- [x] Displays active prayer name, next Jamaat time, and live ticking countdown (hh:mm:ss).
- [x] Mosque profile modals and pages display tabular view of all 5 daily prayers + Jumuah.
- [x] Highlights current prayer dynamically.

## Implementation Files
- Component: `frontend/src/components/PrayerCountdownBanner.tsx`
- Detail Modal: `frontend/src/components/MosqueDetailModal.tsx`
