# ADR-036: Mobile Community Timetable Update & Feedback Modal Architecture

## Status
Accepted

## Date
2026-10-10

## Context
In accordance with ADR-021 and ADR-027, the platform empowers worshippers and musallis to directly correct out-of-date congregational prayer times (Jamaat) and submit role-targeted suggestions or maintenance reports without waiting for central moderation backlogs.

On the mobile client (`mobile-app-expo`), users inspecting a mosque via `MosqueDetailSheet` frequently observe seasonal shifts in local Jamaat times (e.g., winter Asr shifting from 4:30 to 4:45 PM). Mobile users require:
1. **Frictionless Waqt Selection**: Segmented pills for each prayer (Fajr, Zuhr, Asr, Maghrib, Isha, Jumu'ah) to modify individual prayer times cleanly without manual re-typing of untouched waqts.
2. **Instant Optimistic Feedback**: Users receive immediate confirmation upon submission, with the new schedule updated locally while queuing to the backend API (`PUT /api/v1/mosques/:id/prayer-schedule` or `POST /api/v1/mosques/:id/suggestions`).
3. **Ferio Visual Aesthetics**: Clean typography, 12px card borders, no heavy drop-shadows, and high-contrast status feedback.

## Decision

1. **Waqt-Specific Adjustment Dialog (`TimetableUpdateModal.tsx`)**:
   - Launched directly from `MosqueDetailSheet` via an "Update Timetable" action pill in the timetable card header.
   - User selects the target prayer waqt using horizontal pills (`Fajr`, `Zuhr`, `Asr`, `Maghrib`, `Isha`, `Jumu'ah`).
   - Time input accepts 24h format (`HH:mm`) with micro-validation and 12-hour AM/PM preview.
   - Optional note input allows citing committee announcement or seasonal change reason (e.g., *"Winter schedule announced after Jummah"*).

2. **Optimistic Schedule Application & Background Sync**:
   - Submitting updates immediately mutates the active local mosque schedule in memory and local store.
   - Shows an instant Ferio-styled success toast / status pill.
   - Dispatches `ApiClient.updatePrayerSchedule(mosqueId, partialSchedule, reason)` in the background with Bearer token if logged in.

3. **Role-Targeted Feedback Gateway (ADR-027)**:
   - Includes a toggle to switch between `Timetable Correction` and `General Suggestion / Maintenance`.
   - General suggestion allows selecting target roles (`Imam`, `Muazzin`, `Khadem`, `Committee`) and urgency level (`Low`, `Medium`, `Urgent`).

## Consequences

### Positive
- **Real-Time Timetable Freshness**: Empowers on-site worshippers to rectify outdated Jamaat times in under 10 seconds.
- **Immediate Local Delight**: Users are never blocked by slow network spinners or modal lockouts.
- **Complete Parity with Web & Backend**: Conforms to `ADR-021` and `ADR-027`.

### Trade-offs
- Optimistic time updates may temporarily differ from server records if the device loses connection before background sync finishes; local store queues payload and retries.
