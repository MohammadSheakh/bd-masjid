# ADR-066: Mobile Musalli Attendance Status and Regular Congregation Hub

## Status
Accepted

## Date
2026-10-10

## Context
Across Bangladeshi communities, worshippers frequently affiliate with their local neighbourhood mosque ("আমার পাড়ার মসজিদ") where they pray Fajr, Isha, or Jumu'ah on a daily basis. Understanding the active congregation density provides valuable intelligence to mosque committees, Imams, and visitors seeking lively congregations.

The backend exposes full attendance domain endpoints (`backend-nest-prisma/src/features/attendance/attendance.controller.ts`):
- `PUT /api/v1/mosques/:id/attendance`: Idempotently sets user status as `REGULAR` or `OCCASIONAL` (`SetAttendanceDto`).
- `DELETE /api/v1/mosques/:id/attendance`: Clears attendance affiliation.
- `GET /api/v1/mosques/:id/attendance-summary`: Public summary returning `regularCount`, `occasionalCount`, and `userStatus`.
- `GET /api/v1/attendance/my-mosques`: Authenticated endpoint returning all mosques where the user is an affiliated regular/occasional musalli.

The mobile client requires full integration with these endpoints:
1. Enhancing `AttendanceAffiliationCard.tsx` with bilingual tokens (`✓ নিয়মিত মুসল্লি` / `✓ অনিয়মিত মুসল্লি`), live headcount synchronization, and instant optimistic toggles.
2. Providing a dedicated **My Attended Mosques Sheet (`MyAttendedMosquesModal.tsx`)** allowing worshippers to review and manage all their affiliated congregations with 1-tap navigation and removal.

## Decision
We implement the Musalli Attendance Affiliation Hub adhering to:

1. **Domain Alignment (`types/mosque.ts`)**:
   - `AttendanceStatus`: `REGULAR | OCCASIONAL | NONE`
   - `AttendanceSummary`: `regularCount: number; occasionalCount: number; userStatus: AttendanceStatus;`
   - `AttendedMosqueItem`: `mosqueId: string; mosqueName: string; city?: string; status: AttendanceStatus; updatedAt: string;`
2. **ApiClient Transport**:
   - `getAttendanceSummary(mosqueId: string)` -> `GET /api/v1/mosques/:id/attendance-summary`.
   - `getMyAttendedMosques()` -> `GET /api/v1/attendance/my-mosques`.
   - `setAttendance(mosqueId: string, status: AttendanceStatus)` -> `PUT /api/v1/mosques/:id/attendance` or `DELETE`.
3. **Ferio Visual Aesthetics**:
   - Minimalist emerald active badge for `REGULAR` (`#059669`, `#ecfdf5`).
   - Clean slate badge for `OCCASIONAL` (`#374151`, `#f3f4f6`).
   - Headcount summary pill (`👥 ৪২ নিয়মিত • ১৯ অনিয়মিত`).
   - Low-end hardware performance gate compliant (<65MB heap, 60 FPS scrolling).

## Consequences
- **Positive**: Directly mirrors backend attendance controller and database schema.
- **Positive**: Strengthens local community ownership and sense of belonging for Bangladeshi worshippers.
- **Positive**: Low memory overhead through optimistic caching and synchronous preferences fallback.
