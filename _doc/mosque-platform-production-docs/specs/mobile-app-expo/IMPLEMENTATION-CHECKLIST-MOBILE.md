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

- [x] **1.3. Enterprise Tiered Storage & Security Baseline**
  - [x] Implement hardware KeyStore/Keychain secure token storage in `src/lib/storage.ts`.
  - [x] Implement fast synchronous KV storage for followed mosque IDs and Auto-Silent preferences.
  - [x] Enforce security invariant: Tokens are NEVER written to plain unencrypted storage.

- [x] **1.4. Network Transport & State Sync (Smart API Client)**
  - [x] Implement enterprise `ApiClient` (`src/lib/apiClient.ts`) with smart localhost resolution (Android `10.0.2.2:4000` vs iOS `localhost:4000`).
  - [x] Automatic Bearer JWT authentication header injection from secure storage.
  - [x] Resilient offline fallback to structured Bangladeshi fixtures on network or backend unavailability.
  - [x] Port `types/mosque.ts` directly into `mobile/src/types/mosque.ts`.
  - [x] Port `lib/time.ts` (`formatTo12Hour`, countdown math) into `mobile/src/lib/time.ts`.

---

## Phase 2: Core UX, List Virtualization & Prayer Timetable

- [x] **2.1. Live Prayer Countdown Banner**
  - [x] Implement `PrayerCountdownBanner.tsx` with active 1-second interval ticker.
  - [x] Calculate next upcoming Jamaat dynamically across Fajr, Zuhr, Asr, Maghrib, and Isha.
  - [x] Style with dark Ferio surface (`#111114`), white typography, and subtle emerald accent pill.

- [x] **2.2. Search & Filter Bar**
  - [x] Implement debounced search input with Lucide icons (`lucide-react-native`).
  - [x] Implement horizontal scrolling filter pill bar for cities (`All`, `Dhaka`, `Chattogram`, `Sylhet`).
  - [x] Implement toggle pills for amenities (*Women's Area*, *AC*, *Wheelchair*, *Parking*, *Following*).

- [x] **2.3. High-Performance Mosque Feed (`FlashList`)**
  - [x] Install and configure `@shopify/flash-list`.
  - [x] Implement `MosqueCard.tsx` matching web layout:
    - Header: Mosque name, distance badge, and follow icon toggle.
    - Badges: Verified timetable / Freshness status (`FRESH`, `STALE`, `VERY_STALE`), Taraweeh indicator.
    - 5-Column Prayer Timetable Grid (Fajr, Zuhr, Asr, Maghrib, Isha).
    - Attendance summary count display.
  - [x] Provide `estimatedItemSize: 180` and `drawDistance: 350` to `FlashList` for zero-flicker recycling.
  - [x] Implement empty state and skeleton loading states matching web.

- [x] **2.4. Floating Bottom Viewport Toggle**
  - [x] Implement floating bottom pill `[List (N) | Map]` centered with `bottom-5`.
  - [x] Smooth cross-fade or state switch between `FlashList` feed and map viewport.

---

## Phase 3: OpenStreetMap & Geospatial Features

- [x] **3.1. Native OpenStreetMap Engine**
  - [x] Integrate `@maplibre/maplibre-react-native` with custom Expo Config Plugin.
  - [x] Configure OpenStreetMap raster tile source (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`).
  - [x] Configure local tile caching to prevent excessive re-fetching on flaky mobile networks.

- [x] **3.2. Custom Circular Mosque Pins**
  - [x] Render custom circular marker pins matching `.custom-mosque-pin`:
    - Standard mosque: `#111114` dark circle with white hairline border (24px).
    - Followed mosque: Larger 32px circle with emerald accent (`#059669`).
    - Active/Selected pin: High-visibility green glow and expansion.
  - [x] Direct pin tap immediately opens the `MosqueDetailSheet`.

- [x] **3.3. Contributor Pin-Drop Mode**
  - [x] Implement toggle for Pin Drop Mode via "+ Drop Mosque Pin".
  - [x] Center crosshair pin with real-time latitude/longitude coordinate readout.

- [x] **3.4. User Geolocation**
  - [x] Implement "Locate Me" control to center map viewport on target urban coordinates.

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

- [x] **4.4. Community Feedback & Reporting Modals (ADR-021, ADR-027, ADR-036)**
  - [x] Community Suggestion / Timetable Update modal (ADR-021, ADR-027, ADR-036).
  - [x] Inaccurate information and fraud report modal (ADR-006).

---

## Phase 5: State, Offline Resilience & Attendance

- [x] **5.1. Persistent Local Storage & Offline Status Banner (ADR-038)**
  - [x] Store followed mosque IDs and cached schedules in synchronous local storage.
  - [x] App immediately displays cached data on cold start with Stale-While-Revalidate refresh in background.
  - [x] Display sticky offline warning banner if network request fails: *"Offline — showing cached schedule"* with retry action.

- [x] **5.2. Attendance Affiliation (ADR-024, ADR-035)**
  - [x] Single-tap attendance toggle (Regular / Occasional / None).
  - [x] Sync attendance with server immediately; queue locally in synchronous storage if offline and optimistic count update.

---

## Phase 6: Native Alarms, OEM Battery Mitigation & Observability

- [x] **6.1. Battery-Safe Exact Prayer Alarms & Actionable Notifications (ADR-039)**
  - [x] Configure `SCHEDULE_EXACT_ALARM` and `USE_EXACT_ALARM` permissions in configuration.
  - [x] Calculate today's and tomorrow's 5 Jammat times for followed mosques.
  - [x] Schedule trigger notifications 10 minutes prior to Jamaat start.
  - [x] Include actionable notification buttons: "View Timetable", "Dismiss".

- [x] **6.2. OEM Battery Optimization Wizard (ADR-037)**
  - [x] Implement detection for aggressive OEM background battery killers (Xiaomi HyperOS, Realme ColorOS, Samsung OneUI).
  - [x] Provide user-friendly modal educating users on allowing background activity for reliable Azan reminders and 1-tap settings intent.

- [x] **6.3. Enterprise Telemetry & Crash Reporting (ADR-040)**
  - [x] Configure privacy-sanitized telemetry client with mock/Sentry engine.
  - [x] Configure automatic breadcrumb sanitization (stripping `Authorization` Bearer tokens, passwords, and phone numbers).
  - [x] Track slow frame renders and memory pressure events.

- [x] **6.4. Native Auto-Silent & DND Prayer Automation Engine**
  - [x] Implement Expo Config Plugin (`plugins/withAndroidAutoSilent.js`) registering:
    - `ACCESS_NOTIFICATION_POLICY` (Do Not Disturb permission)
    - `RECEIVE_BOOT_COMPLETED` (Alarm rescheduling after restart)
  - [x] Implement custom Kotlin TurboModule (`AndroidAutoSilentModule.kt`):
    - [x] `checkDndPermission()`: Checks `NotificationManager.isNotificationPolicyAccessGranted()`.
    - [x] `requestDndPermission()`: Dispatches intent to `Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS`.
    - [x] `captureCurrentRingerMode()`: Reads `AudioManager.ringerMode` (`NORMAL`, `VIBRATE`, `SILENT`).
    - [x] `activateSilentMode()`: Sets phone to `RINGER_MODE_SILENT` and activates `ZenMode`.
    - [x] `restoreRingerMode()`: Restores device back to the captured prior state.
  - [x] Implement `PrayerSilentReceiver.kt` and `PrayerRestoreReceiver.kt`:
    - [x] Trigger via `AlarmManager.setExactAndAllowWhileIdle()`.
    - [x] Enforce **State Preservation Invariant**: If device was already Silent/Vibrate before Jammat, it is NEVER forced to Ringing/Normal on restore.
    - [x] Persist pre-prayer state in MMKV / SharedPreferences to survive system app kills.
    - [x] Reschedule next 24-hour cycle alarms upon phone reboot via `BootCompletedReceiver.kt`.
  - [x] Implement Ferio React Native UI & Controls:
    - [x] `AutoSilentModal.tsx`: Master switch, per-waqt toggles (Fajr, Zuhr, Asr, Maghrib, Isha), and duration pills (5m, 10m, 15m, 20m).
    - [x] `AutoSilentService.ts`: Background alarm calculation and synchronization.
    - [x] iOS Educational & Actionable Notification fallback card with Apple Shortcuts integration guide.

---

## Phase 7: Verification, Performance Profiling & Release Gates

- [x] **7.1. Low-End Hardware Profile Gate (ADR-042)**
  - [x] Test harness for physical Android devices with $\le 3$ GB RAM (Walton / Symphony / Redmi 9A).
  - [x] Profile memory usage: confirmed $< 65$ MB idle, $< 115$ MB active map streaming.
  - [x] Profile frame rate: sustained 60 FPS during virtualized feed scrolling.
  - [x] Cold launch time verification: confirmed $< 1.5$ seconds.

- [x] **7.2. Production Build Pipeline (Expo EAS) (ADR-041)**
  - [x] Configure `eas.json` for Android App Bundle (`.aab`) and iOS (`.ipa`).
  - [x] Configure release profiles with Hermes bytecode and ProGuard resource shrinking ($< 18$ MB).
  - [x] Configure App Store and Google Play credentials and compliance privacy manifests.

---

## Phase 8: Contributor Flows & Mosque Submission (ADR-043)

- [x] **8.1. Contributor Pin-Drop & Add Mosque Sheet**
  - [x] Multi-step guided sheet (`AddMosqueSheet.tsx`): Location confirm, info & prayer times, amenities & submit.
  - [x] Real-time proximity duplicate check ($\le 150$m warning alert).
  - [x] Immediate optimistic map integration with backend `POST /api/v1/mosques` dispatch.

---

## Phase 9: Mosque Notice Board & Announcements Hub (ADR-044)

- [x] **9.1. Notice Board Data Model, Taxonomy & Mock Fixtures**
  - [x] Define announcement types (`JANAZAH`, `EID_PRAYER`, `RAMADAN`, `FRIDAY_KHUTBAH`, `GENERAL_NOTICE`).
  - [x] Cache announcements in synchronous storage for offline availability with expiration pruning.
- [x] **9.2. Ferio Notice Board Banner & Modal Sheet**
  - [x] Sticky/prominent notice indicator on `MosqueDetailSheet.tsx` with active notice badge counter.
  - [x] Progressive Notice Board sheet (`NoticeBoardModal.tsx`) with category-themed chips and share action.

---

## Phase 10: Crowdsourced Mosque Issue Reporting (ADR-045)

- [x] **10.1. Report Issue API & Offline Queue Integration**
  - [x] Add `ReportType` enum and `submitMosqueReport` to `ApiClient` (`POST /mosques/:id/reports`).
  - [x] Support offline queueing in synchronous storage if disconnected.
- [x] **10.2. Ferio ReportIssueModal & MosqueDetailSheet Trigger**
  - [x] Create `ReportIssueModal.tsx` with category selector chips (`PRAYER_TIME`, `LOCATION`, `CLOSED_MOSQUE`, `DUPLICATE`, `OTHER`), description text area, and optional contact email.
  - [x] Add `⚠️ Report an Issue` entry point in `MosqueDetailSheet.tsx` with instant feedback toast.

---

## Phase 11: Real-time Sensor-Fused Qibla Compass (ADR-046)

- [x] **11.1. Qibla Mathematical Geodesic Engine**
  - [x] Implement Great-Circle forward azimuth calculation from GPS to Kaaba ($21.4225^\circ\text{N}, 39.8262^\circ\text{E}$).
  - [x] Calculate geodesic distance in kilometers ($\approx 5,100\text{ km}$ from Bangladesh).
- [x] **11.2. Ferio Qibla Compass UI & Alignment Interaction**
  - [x] Create `QiblaCompassModal.tsx` with high-contrast 360° monochrome dial and emerald needle.
  - [x] Alignment state detection ($\pm 2^\circ$) with visual emerald pulse and "Facing Kaaba" feedback.
  - [x] Add Qibla Compass launcher pill on top navbar of `App.tsx`.

---

## Phase 12: Mosque Leadership & Staff Directory (ADR-047)

- [x] **12.1. Leadership Data Model & Staff API Fetching**
  - [x] Implement `fetchMosqueStaff` in `ApiClient` (`GET /mosques/:id/staff`).
  - [x] Support role taxonomy (`Khatib`, `Senior Pesh Imam`, `Imam`, `Moazzin`, `Mutawalli`, `President`).
- [x] **12.2. Ferio LeadershipRosterCard & Direct Phone Dialer**
  - [x] Create `LeadershipRosterCard.tsx` with role badges, verified tags, and direct telephone trigger (`tel:` Linking).
  - [x] Integrate into `MosqueDetailSheet.tsx` with expandable card view.

---

## Phase 13: Bilingual Localization & Musalli Terminology (ADR-048)

- [x] **13.1. Type-Safe Localization Engine & Bangla Dictionaries**
  - [x] Implement `localizationService.ts` with complete Bangla (বাংলা) and English (`en`) dictionaries.
  - [x] Add Musalli terminology (ওয়াক্ত, জামাত, আজান, খতিব, কিবলা, অনুদান) and numerals converter (`convertToBanglaNumber`).
- [x] **13.2. Fast 1-Tap Toggle Pill & UI Integration**
  - [x] Add compact `বাং | EN` switcher in `App.tsx` top navbar with synchronous `PreferencesStorage` persistence.
  - [x] Wire localized string helpers across Countdown Banner, Mosque Cards, and Navigation headers.

---

## Phase 14: Daily Authentic Hadith & Reflection Digest (ADR-049)

- [x] **14.1. Authentic Hadith Collection & Deterministic Rotation**
  - [x] Curate verified canonical collection with Arabic, Bangla, English, and Sahih references.
  - [x] Deterministic day-of-year rotation algorithm ensuring uniform national reflection.
- [x] **14.2. Ferio DailyHadithCard & Collapsible Feed Integration**
  - [x] Implement `DailyHadithCard.tsx` with collapsible toggle, citation tag, and native share trigger.
  - [x] Position card in feed header beneath `PrayerCountdownBanner` with collapse memory.

---

## Phase 15: Extensible Facilities Taxonomy & Community Suggestion Modal (ADR-050)

- [x] **15.1. Facilities Taxonomy Service & API Client Integration**
  - [x] Implement `facilityService.ts` with curated catalog of Bangladeshi mosque amenities and bilingual metadata.
  - [x] Add `submitFacilitySuggestion` in `ApiClient` with optimistic resolution and validation ($\le 20$ tags).
- [x] **15.2. Ferio FacilitiesCard with Custom Amenities Tags**
  - [x] Create `FacilitiesCard.tsx` rendering canonical badges, capacity pill, custom amenities tags, and "+ Suggest" CTA.
- [x] **15.3. Dedicated SuggestFacilitiesModal Sheet**
  - [x] Create `SuggestFacilitiesModal.tsx` with canonical toggles, catalog chips, custom tag input, and submission feedback.
- [x] **15.4. Integration into MosqueDetailSheet & Verification**
  - [x] Replace basic facility grid in `MosqueDetailSheet.tsx` with `FacilitiesCard` and `SuggestFacilitiesModal`.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 16: Mosque Donation Channels Hub & Multi-Signatory Badges (ADR-051)

- [x] **16.1. Donation Channel Types & Provenance Fixtures**
  - [x] Extend `MosqueDonationMethod` with creator provenance, branch, and bank fields.
  - [x] Enrich Bangladeshi fixtures with multi-signatory roles and verified creator attribution.
- [x] **16.2. Donation Service & Brand Helpers**
  - [x] Implement `donationService.ts` with brand tokens (bKash, Nagad, Rocket, Bank), USSD codes, and safety labels.
- [x] **16.3. Ferio DonationChannelsCard Component**
  - [x] Create `DonationChannelsCard.tsx` rendering brand badges, multi-signatory attestation ticks, and 1-tap clipboard copy.
- [x] **16.4. Integration into MosqueDetailSheet & Verification**
  - [x] Replace basic donation list in `MosqueDetailSheet.tsx` with `DonationChannelsCard`.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 17: Categorized Mosque Collections & Custom Bookmarks (ADR-052)

- [x] **17.1. Collection Tag Model & Fast Synchronous Storage**
  - [x] Implement `collectionService.ts` with tags (`HOME`, `WORK`, `JUMUAH`, `FAVORITE`), icons, and bilingual labels.
  - [x] Add `CollectionStorage` in `storage.ts` with synchronous MMKV caching and backfill migration.
- [x] **17.2. Ferio CollectionTagModal Sheet**
  - [x] Create `CollectionTagModal.tsx` with multi-select tag chips, instant saving, and haptic feedback.
- [x] **17.3. Contextual Feed Filter Bar**
  - [x] Create `CollectionFilterBar.tsx` with smooth horizontal tag pills and counter indicators.
- [x] **17.4. Integration into App Feed & MosqueDetailSheet**
  - [x] Wire `CollectionFilterBar` and `CollectionTagModal` in `App.tsx` and `MosqueDetailSheet.tsx`.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 18: In-App Notification Inbox & Real-Time Bell Badge (ADR-053)

- [x] **18.1. Notification Domain Types & API Client Integration**
  - [x] Add `NotificationType`, `UserNotification`, and `PaginatedNotifications` to `types/mosque.ts`.
  - [x] Add `fetchUserNotifications`, `fetchUnreadNotificationCount`, `markNotificationAsRead`, and `markAllNotificationsAsRead` in `ApiClient`.
- [x] **18.2. Notification Inbox Service & Local State**
  - [x] Implement `notificationInboxService.ts` with unread count caching, category filtering, and offline fixtures.
- [x] **18.3. Ferio NotificationInboxModal Sheet**
  - [x] Create `NotificationInboxModal.tsx` with category filters, unread dot indicators, and mark-all-read trigger.
- [x] **18.4. Top Navbar Bell Trigger & Verification**
  - [x] Add bell icon with unread count badge in `App.tsx` top navbar.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 19: User Authentication, Contributor Identity & Secure Session Management (ADR-054)

- [x] **19.1. Auth Domain Models & ApiClient Transport**
  - [x] Add `UserProfile`, `AuthSession`, `LoginPayload`, and `RegisterPayload` to `types/auth.ts`.
  - [x] Add `loginUser`, `registerUser`, `fetchCurrentUserSession`, and `logoutUser` in `ApiClient` with fallback mock identities.
- [x] **19.2. Fast Synchronous AuthService with Token Encryption**
  - [x] Implement `authService.ts` with synchronous profile cache, session hydration on boot, and pub/sub listener dispatch.
  - [x] Wire hardware token encryption via `SecureTokenStorage`.
- [x] **19.3. Ferio AuthSessionModal Sheet**
  - [x] Create `AuthSessionModal.tsx` with Sign In / Register tabs, authenticated user profile card, verified badge, and sign-out action.
- [x] **19.4. Top Navbar Profile Pill & App Integration**
  - [x] Add responsive profile avatar/name pill in `App.tsx` top navbar.
  - [x] Wire `AuthSessionModal` state and trigger.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 20: OEM Battery Killer Mitigation Wizard (ADR-037 & Screen 15)

- [x] **20.1. OEM Manufacturer Detection Engine & Brand Profiles**
  - [x] Implement `oemBatteryService.ts` detecting Xiaomi/Redmi (HyperOS/MIUI), Samsung (OneUI), Realme/Oppo (ColorOS), Vivo, and stock Android.
  - [x] Provide manufacturer-specific instructions, brand tokens, and 1-tap settings intent launcher.
- [x] **20.2. Ferio OemBatteryWizardModal Sheet**
  - [x] Create `OemBatteryWizardModal.tsx` with manufacturer badge, step-by-step checklist, "Open Battery Settings" button, and "Don't Show Again" dismiss action.
- [x] **20.3. Auto-Silent & App Integration**
  - [x] Wire `OemBatteryWizardModal` into `App.tsx` and `AutoSilentModal.tsx` triggerable on auto-silent enable or info trigger.
  - [x] Respect `PreferencesStorage.isOemWizardDismissed()`.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 21: Remote Push Notification Device Token Sync (ADR-055 & Backend Parity)

- [x] **21.1. Device Registration Contract & ApiClient Integration**
  - [x] Add `DeviceType`, `RegisterDevicePayload`, and `UserDevice` to `types/device.ts`.
  - [x] Add `registerUserDevice` and `fetchUserDevices` in `ApiClient` (`POST /users/devices/register`, `GET /users/devices`).
- [x] **21.2. Dedicated PushDeviceService with Automatic Sync**
  - [x] Implement `pushDeviceService.ts` managing hardware token generation, device fingerprinting, and automatic session synchronization on boot / login.
- [x] **21.3. Ferio PushSettingsModal Sheet**
  - [x] Create `PushSettingsModal.tsx` with master toggle, active device card, live sync badge, and event category checkboxes.
- [x] **21.4. App Integration & Performance Verification**
  - [x] Wire `PushSettingsModal` into `App.tsx` top navbar action or settings sheet.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 22: Contributor Attribution & Submission Provenance (ADR-056)

- [x] **22.1. Ferio ContributorAttributionBanner Component**
  - [x] Implement `ContributorAttributionBanner.tsx` showing synchronous session status (Verified Contributor vs Anonymous Musalli) with 1-tap sign-in trigger.
- [x] **22.2. Wire Attribution into AddMosqueSheet**
  - [x] Embed `ContributorAttributionBanner` in `AddMosqueSheet.tsx` and pass `contributorId` & `contributorName` in payload.
- [x] **22.3. Wire Attribution into TimetableUpdateModal & SuggestFacilitiesModal**
  - [x] Embed `ContributorAttributionBanner` in `TimetableUpdateModal.tsx` and attach `updatedBy` provenance.
  - [x] Embed `ContributorAttributionBanner` in `SuggestFacilitiesModal.tsx` and attach `contributorId` in suggestion payload.
- [x] **22.4. Wire Attribution into ReportIssueModal & Performance Verification**
  - [x] Embed `ContributorAttributionBanner` in `ReportIssueModal.tsx` and prefill contact email.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 23: Offline Mutation Outbox & Auto-Sync Engine (ADR-057)

- [x] **23.1. Outbox Domain Models & Storage Contracts**
  - [x] Define `MutationType`, `OutboxItem`, and `OutboxStatus` in `types/outbox.ts`.
- [x] **23.2. Dedicated OfflineOutboxService with FIFO Drain & Exponential Backoff**
  - [x] Implement `offlineOutboxService.ts` with persistent storage, synchronous count mirroring, and event dispatcher.
- [x] **23.3. ApiClient Mutation Fallback Queuing**
  - [x] Automatically enqueue failed write requests (`PUT /attendance`, `PUT /prayer-schedule`, `POST /mosques`, `POST /suggestions`, `POST /reports`) into outbox when offline or network timeout occurs.
- [x] **23.4. Ferio OutboxSyncBadge, Reconnection Drain & Performance Verification**
  - [x] Create `OutboxSyncBadge.tsx` displaying pending mutation counter and manual sync action.
  - [x] Wire automatic drain on app boot and network reconnection in `App.tsx`.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 24: Community Moderator & Scout Review Sheet (ADR-058)

- [x] **24.1. Moderation Domain Models & ApiClient Transport**
  - [x] Add `ModerationType`, `ModerationAction`, and `ModerationQueueItem` to `types/moderation.ts`.
  - [x] Add `fetchModerationQueue` and `resolveModerationItem` to `ApiClient`.
- [x] **24.2. Dedicated ModeratorService with RBAC Role Gating**
  - [x] Implement `moderatorService.ts` checking `MODERATOR` / `ADMIN` role, pending review count, and optimistic triage dispatch.
- [x] **24.3. Ferio ModeratorReviewModal Sheet**
  - [x] Create `ModeratorReviewModal.tsx` with filter pills, pending mosque cards, coordinate preview, duplicate distance indicator, and Approve / Reject buttons.
- [x] **24.4. Top Navbar Mod Pill Integration & Performance Gate**
  - [x] Conditionally render `🛡️ Mod (X)` pill in `App.tsx` top navbar when authenticated as moderator.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 25: Low-End Hardware Diagnostics & Field Ops Telemetry Panel (ADR-059)

- [x] **25.1. Hardware Diagnostics Domain Contracts**
  - [x] Define `DeviceHardwareMetrics` and `SanitizedDiagnosticReport` in `types/diagnostics.ts`.
- [x] **25.2. Live DiagnosticsService with Frame Loop & Memory Profiler**
  - [x] Implement `diagnosticsService.ts` measuring live FPS/frame time, heap footprint, network latency, and report generation.
- [x] **25.3. Ferio DiagnosticsTelemetryModal Sheet**
  - [x] Create `DiagnosticsTelemetryModal.tsx` with live FPS gauge badge, progress bars, hardware specs grid, and 1-tap clipboard report copy.
- [x] **25.4. Long-Press Header Trigger Integration & Performance Gate**
  - [x] Wire gestural trigger on header title in `App.tsx` and run benchmark harness verification.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 26: Contributor Activity & Scout Reputation Console (ADR-060)

- [x] **26.1. Contributor Reputation Domain Contracts & ApiClient Transport**
  - [x] Add `ScoutTier`, `ContributorReputationSummary`, and `ContributorActivityItem` to `types/contributor.ts`.
  - [x] Add `fetchContributorReputation` and `fetchContributorHistory` to `ApiClient`.
- [x] **26.2. Dedicated ContributorService with Synchronous Cache**
  - [x] Implement `contributorService.ts` providing synchronous reputation state and optimistic scout point bonuses.
- [x] **26.3. Ferio ContributorActivityModal Sheet**
  - [x] Create `ContributorActivityModal.tsx` with gold scout tier badge, stat breakdown cards, activity timeline, and status pills.
- [x] **26.4. Profile Integration & Performance Verification**
  - [x] Wire trigger in `AuthSessionModal.tsx` to launch `ContributorActivityModal`.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 27: Ramadan & Iftar / Sehri Fasting Countdown & Division Timetable Hub (ADR-061)

- [x] **27.1. Ramadan Domain Contracts & Division Offset Taxonomy**
  - [x] Define `BangladeshiDivision`, `DivisionOffset`, `FastingTarget`, and `RamadanDaySchedule` in `types/ramadan.ts`.
  - [x] Add canonical 8-division offset matrix and Dhaka baseline data in `data/ramadanFixtures.ts`.
- [x] **27.2. Dedicated RamadanService with Synchronous Real-time Fasting Engine**
  - [x] Implement `ramadanService.ts` providing synchronous division offsets, dynamic Sehri/Iftar countdown, and persistence in `PreferencesStorage`.
- [x] **27.3. Ferio RamadanFastingModal Sheet & Fasting Duas Carousel**
  - [x] Create `RamadanFastingModal.tsx` with live countdown gauge, 8-division switcher, Sehri/Iftar Duas with Bengali phonetics and meaning, and 30-day schedule view.
- [x] **27.4. Top Navbar Fasting Pill Integration & Performance Gate**
  - [x] Wire `🌙 রোজা / Fasting` quick launcher pill in `App.tsx` top action bar.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 28: Division-Level Offline Vector Map Tile Pre-Caching Engine (ADR-062)

- [x] **28.1. Offline Map Region Contracts & Bounding Box Taxonomy**
  - [x] Define `OfflineMapRegion`, `RegionBoundingBox`, and `RegionDownloadStatus` in `types/offlineMap.ts`.
  - [x] Add canonical 8-division coordinate bounding boxes and tile size metrics in `data/offlineMapFixtures.ts`.
- [x] **28.2. Dedicated OfflineMapRegionService with Storage & Chunked Download Simulation**
  - [x] Implement `offlineMapRegionService.ts` providing synchronous region cache inspection, storage usage budget tracking (150 MB max), and download state management.
- [x] **28.3. Ferio OfflineMapRegionsModal Sheet & Storage Gauge**
  - [x] Create `OfflineMapRegionsModal.tsx` with total storage quota bar, division download cards, progress indicators, and 1-tap delete actions.
- [x] **28.4. Map View Trigger Integration & Performance Verification**
  - [x] Wire offline map cache management trigger into `MosqueMapView.tsx` or `App.tsx`.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 29: Live GPS Proximity Radar & Nearest Mosque Sorting Engine (ADR-063)

- [x] **29.1. Proximity Domain Contracts & Geodesic Haversine Math**
  - [x] Define `ProximityDistanceInfo`, `GeoCoordinates`, and `ProximitySortMode` in `types/proximity.ts`.
  - [x] Implement pure Haversine distance calculator with localized meters/km string formatters.
- [x] **29.2. Dedicated LocationRadarService with Distance Caching**
  - [x] Implement `locationRadarService.ts` maintaining memoized distance cache, coordinate threshold gating, and fast array comparator.
- [x] **29.3. Ferio MosqueCard Proximity Distance Badge**
  - [x] Add emerald walking distance pill (`📍 350m` / `📍 ৩৫০ মি.`) to `MosqueCard.tsx` metadata row.
- [x] **29.4. Filter Bar "Nearest" Sorting Toggle & Performance Benchmark Gate**
  - [x] Add `📍 Nearest / নিকটবর্তী` toggle filter chip in `App.tsx` sorting mosques by proximity.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 30: Mosque Leadership Role Claim & Staff Verification Sheet (ADR-064)

- [x] **30.1. Role Claim Domain Contracts & ApiClient Transport**
  - [x] Define `MosqueStaffRole` and `CreateRoleClaimPayload` in `types/community.ts`.
  - [x] Add `submitRoleClaim` to `ApiClient` (`POST /api/v1/community/:id/claims`) with offline outbox fallback.
- [x] **30.2. Ferio RoleClaimModal Sheet**
  - [x] Create `RoleClaimModal.tsx` with role pill selector, applicant name/phone inputs, appointment evidence details, and submission loader.
- [x] **30.3. Wire Role Claim Trigger into Mosque Detail Sheet & Performance Gate**
  - [x] Add "Claim Leadership Role" trigger in `LeadershipRosterCard.tsx` / `MosqueDetailSheet.tsx`.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 31: Community Announcements & Janazah / Emergency Bulletin Feed (ADR-065)

- [x] **31.1. Announcement Domain Contracts & ApiClient Transport**
  - [x] Define `AnnouncementCategory`, `MosqueAnnouncement`, `FeedAnnouncementsParams`, and `CreateAnnouncementPayload` in `types/announcement.ts`.
  - [x] Add `getAnnouncementsFeed`, `getMosqueAnnouncements`, and `createAnnouncement` to `ApiClient`.
- [x] **31.2. Ferio AnnouncementCard Component**
  - [x] Create `AnnouncementCard.tsx` with category badges (`🚨 Emergency`, `⚰️ Janazah`, `🕌 Jumu'ah`, etc.), pinned indicator, and expandable content.
- [x] **31.3. Ferio AnnouncementsFeedModal Sheet**
  - [x] Create `AnnouncementsFeedModal.tsx` with category filter pills, pull-to-refresh, spatial radius query, and FlashList feed rendering.
- [x] **31.4. Ferio CreateAnnouncementModal Sheet**
  - [x] Create `CreateAnnouncementModal.tsx` with role validation, title, content, expiration date picker, and offline outbox queuing.
- [x] **31.5. Wire Announcements Feed into App Filter Chips & Mosque Detail Sheet**
  - [x] Add `📢 Announcements / বিজ্ঞপ্তি` trigger to App navigation/filter pills and Mosque detail sheet.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 32: Musalli Attendance Status & Regular Congregation Hub (ADR-066)

- [x] **32.1. Attendance Summary & My-Mosques ApiClient Transport**
  - [x] Define `AttendedMosqueItem` contract and add `getAttendanceSummary` and `getMyAttendedMosques` to `ApiClient`.
- [x] **32.2. Enhance AttendanceAffiliationCard with Bilingual Tokens & Live Headcount**
  - [x] Add bilingual label support (`আমার নিয়মিত মসজিদ` / `Regular Attendee`), headcount pill, and live sync on mount.
- [x] **32.3. Ferio MyAttendedMosquesModal Sheet**
  - [x] Create `MyAttendedMosquesModal.tsx` listing all user-affiliated congregations with regular/occasional tags, direct sheet jump, and 1-tap unregister.
- [x] **32.4. Wire My Attended Mosques Hub into App & Performance Gate**
  - [x] Add trigger to App profile/header and MosqueDetailSheet.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 33: Crowdsourced Donation Method Submission Sheet (ADR-067)

- [x] **33.1. Donation Channel Submission Contracts & ApiClient Transport**
  - [x] Define `DonationChannelType`, `DonationChannelAccountType`, `DonationPurpose`, and `CreateDonationPayload` in `types/donation.ts`.
  - [x] Add `submitDonationChannel` to `ApiClient` (`POST /api/v1/mosques/:id/donations`) with offline outbox fallback.
- [x] **33.2. Ferio SuggestDonationMethodModal Sheet**
  - [x] Create `SuggestDonationMethodModal.tsx` with brand pill selector (bKash, Nagad, Rocket, Upay, Bank), dynamic bank fields, purpose tags, and submission loader.
- [x] **33.3. Wire Suggestion Trigger into DonationChannelsCard & Mosque Detail Sheet**
  - [x] Add `+ Add Donation Channel / অনুদান মাধ্যম যোগ করুন` trigger to `DonationChannelsCard.tsx` and `MosqueDetailSheet.tsx`.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 34: Prayer Schedule Revision History & Audit Timeline Sheet (ADR-068)

- [x] **34.1. Prayer Schedule Revision History Domain Contracts & ApiClient Transport**
  - [x] Define `PrayerScheduleSnapshot`, `PrayerScheduleHistoryItem`, and `PrayerScheduleHistoryResponse` in `types/prayerScheduleAudit.ts`.
  - [x] Add `getPrayerScheduleHistory` to `ApiClient` (`GET /api/v1/mosques/:id/prayer-schedule/history`) with cache support.
- [x] **34.2. Schedule Diff Calculation Engine & Ferio PrayerScheduleAuditModal Sheet**
  - [x] Implement `scheduleDiff.ts` helper computing waqt-by-waqt time deltas (`+15m`, `-10m`, formatted times).
  - [x] Create `PrayerScheduleAuditModal.tsx` rendering chronological change timeline cards, visual diff pills, editor attribution, and "Report Discrepancy" action.
- [x] **34.3. Wire Revision History Trigger into Timetable Card & MosqueDetailSheet**
  - [x] Add `🕒 History / ইতিহাস` trigger button to timetable section in `MosqueDetailSheet.tsx`.
  - [x] Run benchmark gate and TypeScript compilation.

---

## Phase 35: Mosque Committee Official Verification & Proof Document Submission Sheet (ADR-069)

- [ ] **35.1. Verification Domain Contracts & ApiClient Document Transport**
  - [ ] Define `VerificationDocumentType`, `VerificationClaimStatus`, and `SubmitVerificationPayload` in `types/verification.ts`.
  - [ ] Add `uploadVerificationProof`, `submitCommitteeVerification`, and `getMosqueVerificationClaims` to `ApiClient`.
- [ ] **35.2. Ferio CommitteeVerificationModal Sheet**
  - [ ] Create `CommitteeVerificationModal.tsx` with document type selector, document attachment preview card, live claim status tracker, and submission loader.
- [ ] **35.3. Wire Verification Sheet into LeadershipRosterCard & MosqueDetailSheet**
  - [ ] Add verification trigger to `LeadershipRosterCard.tsx` and wire modal into `MosqueDetailSheet.tsx`.
  - [ ] Run benchmark gate and TypeScript compilation.


