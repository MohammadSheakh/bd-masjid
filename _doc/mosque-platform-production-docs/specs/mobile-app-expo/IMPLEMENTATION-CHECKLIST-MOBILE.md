# Enterprise Mobile Implementation Checklist: BD Masjid (React Native & Expo SDK 52+)

This checklist tracks production-grade execution for the BD Masjid cross-platform mobile client (`F-040`), ensuring absolute fidelity to the Ferio visual language, server-side invariants, and high performance on budget hardware.

---

## Phase 1: Environment, Prebuild Tooling & Security Foundation

- [x] **1.1. Project Initialization & Custom Development Client**
  - [x] Initialize Expo SDK app in `/mobile` with TypeScript template.
  - [x] Configure Bridgeless New Architecture and Hermes engine.
  - [ ] Install Expo development client (`expo-dev-client`) and generate native directories via `npx expo prebuild`.
  - [ ] Verify clean native builds via `npx expo run:android` and `npx expo run:ios`.

- [x] **1.2. Design System (Ferio Visual System Parity)**
  - [x] Configure Ferio design tokens (`src/theme/tokens.ts`):
    - Primary: `#111114`
    - Muted: `#6e6e73`
    - Border: `#e8e8ea`
    - Canvas: `#fafafa`
    - Surface: `#ffffff`
    - Accent: `#059669` (Active / Emerald)
  - [x] Configure font stack, tabular numerals, and border radii standards: `16px`, `12px`, `full` (pills).
  - [x] Enforce zero glassmorphism, decorative blur, or non-conforming gradients.

- [ ] **1.3. Enterprise Tiered Storage & Security Baseline**
  - [ ] Install `expo-secure-store` and create `src/lib/secureStorage.ts` for encrypted JWT Access/Refresh tokens.
  - [ ] Install `react-native-mmkv` and initialize synchronous instance for fast UI flags and sync timestamps.
  - [ ] Install `expo-sqlite` and configure database migrations for offline mosque profiles and prayer schedules.
  - [ ] Enforce security invariant: Tokens are NEVER written to MMKV or plain storage.

- [ ] **1.4. Network Transport & State Sync (TanStack Query v5)**
  - [ ] Install `@tanstack/react-query` and configure `QueryClient` with:
    - `staleTime: 5 * 60 * 1000` (5 minutes)
    - `gcTime: 24 * 60 * 60 * 1000` (24 hours)
    - Exponential backoff retry logic (1s, 2s, 4s, 8s) up to 3 attempts.
  - [x] Port `types/mosque.ts` directly into `mobile/src/types/mosque.ts`.
  - [x] Port `lib/time.ts` (`formatTo12Hour`, countdown math) into `mobile/src/lib/time.ts`.
  - [ ] Integrate React Query `onlineManager` with `@react-native-community/netinfo` to auto-pause mutations while offline.

---

## Phase 2: Core UX, List Virtualization & Prayer Timetable

- [x] **2.1. Live Prayer Countdown Banner**
  - [x] Implement `PrayerCountdownBanner.tsx` with active 1-second interval ticker.
  - [x] Calculate next upcoming Jamaat dynamically across Fajr, Zuhr, Asr, Maghrib, and Isha.
  - [x] Style with dark Ferio surface (`#111114`), white typography, and subtle emerald accent pill.

- [ ] **2.2. Search & Filter Bar**
  - [ ] Implement debounced search input with Lucide icons (`lucide-react-native`).
  - [ ] Implement horizontal scrolling filter pill bar for cities (`All`, `Dhaka`, `Chattogram`, `Sylhet`).
  - [ ] Implement toggle pills for amenities (*Women's Area*, *AC*, *Wheelchair*, *Parking*, *Following*).

- [ ] **2.3. High-Performance Mosque Feed (`FlashList`)**
  - [ ] Install and configure `@shopify/flash-list`.
  - [ ] Implement `MosqueCard.tsx` matching web layout:
    - Header: Mosque name, distance badge, and follow icon toggle.
    - Badges: Verified timetable / Freshness status (`FRESH`, `STALE`, `VERY_STALE`), Taraweeh indicator.
    - 5-Column Prayer Timetable Grid (Fajr, Zuhr, Asr, Maghrib, Isha).
    - Attendance summary count display.
  - [ ] Provide `estimatedItemSize: 180` and `drawDistance: 350` to `FlashList` for zero-flicker recycling.
  - [ ] Implement empty state and skeleton loading states matching web.

- [ ] **2.4. Floating Bottom Viewport Toggle**
  - [ ] Implement floating bottom pill `[List (N) | Map]` centered with `bottom-5`.
  - [ ] Smooth cross-fade or state switch between `FlashList` feed and map viewport.

---

## Phase 3: OpenStreetMap & Geospatial Features

- [ ] **3.1. Native OpenStreetMap Engine**
  - [ ] Integrate `@maplibre/maplibre-react-native` with custom Expo Config Plugin.
  - [ ] Configure OpenStreetMap raster tile source (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`).
  - [ ] Configure local tile caching to prevent excessive re-fetching on flaky mobile networks.

- [ ] **3.2. Custom Circular Mosque Pins**
  - [ ] Render custom circular marker pins matching `.custom-mosque-pin`:
    - Standard mosque: `#111114` dark circle with white hairline border (22px).
    - Followed mosque: Larger 34px circle with emerald accent (`#059669`).
    - Active/Selected pin: High-visibility green glow and expansion.
  - [ ] Tapping a pin opens the `MosqueDetailSheet`.

- [ ] **3.3. Contributor Pin-Drop Mode**
  - [ ] Implement toggle for Pin Drop Mode when tapping "+ Add Mosque".
  - [ ] Center crosshair pin with real-time latitude/longitude readout.
  - [ ] Action pill: "Confirm Location" $\rightarrow$ opens Mosque Creation form modal.

- [ ] **3.4. User Geolocation**
  - [ ] Request foreground location permission (`expo-location`).
  - [ ] Implement "Locate Me" button to center map and fetch nearby mosques within 10km radius.

---

## Phase 4: Mosque Detail Bottom Sheet & Governance Modals

- [x] **4.1. Gesture-Driven Detail Bottom Sheet**
  - [x] Implement bottom sheet with fluid slide animation over list and map viewports.
  - [x] Implement snap view points with drag handle indicator.
  - [x] Render full 5-prayer + Jumu'ah timetable breakdown and follow action.

- [x] **4.2. Verified Staff Roster Display (ADR-024)**
  - [x] Display verified mosque personnel (Khatib, Pesh Imam, President/Mutawalli) with verified checkmarks.
  - [x] Provide clean empty/fallback handling for mosques without claimed personnel.

- [x] **4.3. Verified Donation Channels (ADR-028)**
  - [x] Display verified donation cards (bKash, Nagad, Rocket, Bank transfer).
  - [x] 1-Tap copy to clipboard with instant visual feedback.
  - [x] Display multi-signatory committee verification ticks (President, Secretary, Mutawalli).

- [ ] **4.4. Community Feedback & Reporting Modals**
  - [ ] Community Suggestion / Timetable Update modal (ADR-021, ADR-027).
  - [ ] Inaccurate information and fraud report modal (ADR-006).

---

## Phase 5: State, Offline Resilience & Attendance

- [ ] **5.1. Persistent Local Storage**
  - [ ] Store followed mosque IDs and cached schedules in `expo-sqlite` and `react-native-mmkv`.
  - [ ] App immediately displays cached data on cold start while refreshing in background.
  - [ ] Display offline warning banner if network request fails: *"Offline — showing cached schedule"*.

- [ ] **5.2. Attendance Affiliation (ADR-024)**
  - [ ] Single-tap attendance toggle (Regular / Occasional / None).
  - [ ] Sync attendance with server immediately; queue locally in MMKV if offline and replay on reconnect.

---

## Phase 6: Native Alarms, OEM Battery Mitigation & Observability

- [ ] **6.1. Battery-Safe Exact Prayer Alarms**
  - [ ] Install `@notifee/react-native`.
  - [ ] Configure `SCHEDULE_EXACT_ALARM` and `USE_EXACT_ALARM` permissions in `app.json`.
  - [ ] Calculate today's and tomorrow's 5 Jammat times for followed mosques.
  - [ ] Schedule trigger notifications 10 minutes prior to Jamaat start.
  - [ ] Include native notification action buttons: "View Timetable", "Dismiss".

- [ ] **6.2. OEM Battery Optimization Wizard**
  - [ ] Implement detection for aggressive OEM background battery killers (Xiaomi HyperOS, Realme ColorOS, Samsung OneUI).
  - [ ] Provide user-friendly modal educating users on allowing background activity for reliable Azan reminders.

- [ ] **6.3. Enterprise Telemetry & Crash Reporting**
  - [ ] Install and configure `@sentry/react-native`.
  - [ ] Configure automatic breadcrumb sanitization (stripping `Authorization` headers, passwords, and phone numbers).
  - [ ] Track slow frame renders and memory pressure events.

- [ ] **6.4. Native Auto-Silent & DND Prayer Automation Engine**
  - [ ] Implement Expo Config Plugin (`plugins/withAndroidAutoSilent.js`) registering:
    - `ACCESS_NOTIFICATION_POLICY` (Do Not Disturb permission)
    - `RECEIVE_BOOT_COMPLETED` (Alarm rescheduling after restart)
  - [ ] Implement custom Kotlin TurboModule (`AndroidAutoSilentModule.kt`):
    - [ ] `checkDndPermission()`: Checks `NotificationManager.isNotificationPolicyAccessGranted()`.
    - [ ] `requestDndPermission()`: Dispatches intent to `Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS`.
    - [ ] `captureCurrentRingerMode()`: Reads `AudioManager.ringerMode` (`NORMAL`, `VIBRATE`, `SILENT`).
    - [ ] `activateSilentMode()`: Sets phone to `RINGER_MODE_SILENT` and activates `ZenMode`.
    - [ ] `restoreRingerMode()`: Restores device back to the captured prior state.
  - [ ] Implement `PrayerSilentReceiver.kt` and `PrayerRestoreReceiver.kt`:
    - [ ] Trigger via `AlarmManager.setExactAndAllowWhileIdle()`.
    - [ ] Enforce **State Preservation Invariant**: If device was already Silent/Vibrate before Jammat, it is NEVER forced to Ringing/Normal on restore.
    - [ ] Persist pre-prayer state in MMKV / SharedPreferences to survive system app kills.
    - [ ] Reschedule next 24-hour cycle alarms upon phone reboot via `BootCompletedReceiver.kt`.
  - [ ] Implement Ferio React Native UI & Controls:
    - [ ] `AutoSilentModal.tsx`: Master switch, per-waqt toggles (Fajr, Zuhr, Asr, Maghrib, Isha), and duration pills (5m, 10m, 15m, 20m).
    - [ ] `AutoSilentStatusBadge.tsx`: Displays active silent countdown or next armed Jammat time.
    - [ ] iOS Educational & Actionable Notification fallback card with Apple Shortcuts integration guide.

---

## Phase 7: Verification, Performance Profiling & Release Gates

- [ ] **7.1. Low-End Hardware Profile Gate**
  - [ ] Test on physical Android device with $\le 3$ GB RAM (e.g. Walton / Symphony / Redmi 9A).
  - [ ] Profile memory usage: must remain $< 65$ MB idle, $< 115$ MB active map streaming.
  - [ ] Profile frame rate: sustained 60 FPS during `FlashList` scrolling.
  - [ ] Cold launch time verification: $< 1.5$ seconds.

- [ ] **7.2. Production Build Pipeline (Expo EAS)**
  - [ ] Configure `eas.json` for Android App Bundle (`.aab`) and iOS (`.ipa`).
  - [ ] Verify release `.aab` download size remains $< 18$ MB.
  - [ ] Configure App Store and Google Play credentials and compliance privacy manifests.
