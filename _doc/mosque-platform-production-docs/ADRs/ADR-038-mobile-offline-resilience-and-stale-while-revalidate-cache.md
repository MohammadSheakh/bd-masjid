# ADR-038: Mobile Offline Resilience, Stale-While-Revalidate Cache, and Offline Status Banner

## Status
Accepted

## Date
2026-10-10

## Context
In Bangladesh, mobile network connectivity varies widely—from high-speed 4G in major urban areas (Dhaka, Chittagong) to intermittent 2G/3G or sudden network dropouts inside mosque basements and rural upazilas. 

If an app adheres to a naive "network-first, blocking spinner" model:
1. Worshippers opening the app to check upcoming Jamaat times or countdowns are stuck staring at infinite loading spinners or error dialogs.
2. The core value of the mobile client—having the neighbourhood mosque timetable instantly accessible offline—is compromised.

Worshippers need instant cold-start application launch with zero spinner delay, resilient offline schedule display, and clear, respectful visual indication when the device is operating offline.

## Decision

1. **Stale-While-Revalidate (SWR) Cache Architecture**:
   - On cold start, the mobile application hydrates immediately (< 50ms) from synchronous local cache (`PreferencesStorage` / fixtures).
   - In the background, `ApiClient.getNearbyMosques()` executes asynchronously to fetch live updates from `/api/v1/mosques/nearby`.
   - If the network call succeeds, the local cache is quietly updated and the UI smoothly re-renders with fresh data.
   - If the network call fails or times out, the cached state remains active without crashing or disrupting the worshipper.

2. **Amber Ferio Offline Banner (`OfflineBanner.tsx`)**:
   - When offline status is detected or an API request fails due to network unavailability, a sticky, non-intrusive banner appears below the countdown banner:
     - Warning icon / text: *"Offline — displaying cached schedules"*.
     - Action pill: `[ Retry ]` allowing the worshipper to manually trigger an immediate network reconnection check.
   - Styling complies strictly with Ferio visual tokens: Warm amber background (`#fffbeb`), subtle border (`#fde68a`), deep amber typography (`#92400e`), 12px pill button (`#fef3c7`).

3. **Cached Timetable Invariant**:
   - The five congregational prayer times (Fajr, Zuhr, Asr, Maghrib, Isha) and Jumu'ah remain fully readable, searchable, and interactive offline.

## Consequences

### Positive
- **Instant Cold Starts**: Zero-delay rendering on launch without blocking network waterfalls.
- **Reliable Mosque Accessibility**: Musallis can verify Jamaat times inside network dead-zones or during data outages.
- **Transparent Communication**: The worshipper is never misled into thinking stale offline times are guaranteed fresh without clear visual notice.

### Trade-offs
- Background revalidation may cause a subtle text update if Jamaat times shifted while the device was offline, but this ensures eventual consistency.
