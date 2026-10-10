# Enterprise Product Requirements Document (PRD): BD Masjid Mobile Client (Android & iOS)

## 1. Executive Summary & Vision
BD Masjid Mobile is the cross-platform native enterprise companion to the BD Masjid web platform. Built with **React Native / Expo SDK 52+**, it provides worshippers, mosque committees, and community members across Bangladesh with instant access to nearby mosques, live Jammat schedules, reliable local prayer reminders, and crowdsourced mosque verification.

The mobile client maintains **100% visual parity with the Ferio Visual System** (`#111114`, `#6e6e73`, `#e8e8ea`, `#fafafa`), while delivering enterprise-grade mobile engineering:
- Zero-leak server-side invariant model (NestJS/PostGIS sovereign authority).
- Resilient multi-tiered offline storage (MMKV for micro-state, SQLite for spatial/schedule cache).
- Resilient network sync via TanStack Query v5 with automatic retries and deduping.
- Hardware-backed token encryption via Android KeyStore / iOS Keychain (`expo-secure-store`).
- Battery-safe exact prayer alarms with OEM battery killer mitigation (Xiaomi HyperOS, Realme ColorOS, Samsung OneUI).
- Intelligent Jammat Auto-Silent & State-Preserving Restore: Automatic DND/Silent switching during 5 daily prayer times with zero-friction restoration to previous ringer state (Android native Kotlin TurboModule, iOS interactive Focus notifications).
- Comprehensive crash telemetry via `@sentry/react-native`.
- Rock-solid 60 FPS scrolling on low-end hardware (Walton, Symphony, Redmi 2GB–4GB RAM).

---

## 2. Core User Personas & Mobile Journeys

### Persona A: Daily Worshipper / Commuter (Guest & Registered)
- **Context**: Walking to Jammat in dense urban areas (Dhaka, Chittagong) or rural districts on 2G/3G/4G with frequent network drops. Frequently forgets to silence phone during prayer, or forgets to un-silence afterward, missing urgent calls.
- **Key Journey**:
  1. Open app $\rightarrow$ instant view of followed mosques served directly from local SQLite cache ($< 50$ ms), while TanStack Query validates updates in the background.
  2. Live `PrayerCountdownBanner` renders real-time 1-second interval countdown to the next Jammat.
  3. Toggle floating bottom pill to `Map` $\rightarrow$ inspect OpenStreetMap raster tiles showing nearby mosque pins.
  4. Tap a mosque $\rightarrow$ swipe up native bottom sheet (`@gorhom/bottom-sheet`) displaying verified timetable, facilities (AC, Women's section, Parking), and attendance counts.
  5. Tap "Follow" $\rightarrow$ local notifications automatically registered for daily Azan/Jammat reminders.
  6. Configures "Prayer Auto-Silent" $\rightarrow$ grants Android Do Not Disturb permission once; phone automatically transitions to Silent mode at Jammat start for 10 minutes, then reliably restores to its prior ringer state.

### Persona B: Contributor / Community Scout
- **Context**: Standing outside a newly built or unlisted mosque; captures location coordinates directly via GPS.
- **Key Journey**:
  1. Tap "+ Add Mosque" $\rightarrow$ enters Pin Drop Mode on OpenStreetMap.
  2. Pin is placed automatically at current GPS coordinates; contributor fine-tunes position on the map.
  3. Fills in mosque name, city, and basic Jammat times $\rightarrow$ submits directly to NestJS backend for duplicate proximity analysis (ADR-005).

### Persona C: Mosque Committee Executive (Imam, Mutawalli, President, Secretary)
- **Context**: Trusted mosque official managing daily schedules, community notices, and verified donations.
- **Key Journey**:
  1. Authenticate with phone/email credentials $\rightarrow$ JWT tokens securely stored in hardware-backed `expo-secure-store`.
  2. Access mosque committee dashboard $\rightarrow$ update daily Jammat timings with instant release (ADR-021).
  3. Post official announcements with expiration dates (ADR-011).
  4. View multi-signatory leadership endorsements on donation channels (ADR-028).

---

## 3. Product Principles & Mobile Invariants

1. **Ferio Visual Parity**:
   The mobile UI must match the web application's minimalist, utilitarian aesthetics:
   - Palette: `#111114` (primary text/buttons), `#6e6e73` (muted metadata), `#e8e8ea` (borders), `#fafafa` (canvas), `#ffffff` (cards).
   - Micro-tokens: 10px–12px card radii, rounded-full pill buttons, hairline 1px borders, crisp system/Inter typography.
   - Strictly NO decorative gradients, 3D shadows, or heavy glassmorphism.
2. **Server-Side Sovereign Invariants**:
   The mobile app is strictly an untrusted presentation layer. All geospatial calculations, duplicate detection, permissions, and audit logs are executed authoritatively by the NestJS backend.
3. **OpenStreetMap Independence**:
   The app must use OpenStreetMap raster tiles (via `@maplibre/maplibre-react-native`) without requiring proprietary Google Maps billing or API keys.
4. **Tiered Offline Architecture**:
   - Micro-state & Flags: Stored in synchronous `react-native-mmkv` ($< 1$ ms read/write).
   - Structured Cache: Full mosque directory and schedules stored in `expo-sqlite`.
   - Credentials: JWT tokens stored in hardware-backed `expo-secure-store`.
   - If network drops, the app functions in offline mode with an explicit badge: *"Offline — showing cached schedule"*.
5. **Exact Battery-Friendly Alarms**:
   Azan and Jammat notifications must rely on Android's native `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` with OEM battery optimization bypass guidance, avoiding persistent background service loops.
6. **Prayer Auto-Silent & Prior-State Invariant**:
   - **State Preservation Invariant**: The device's ringer state (`NORMAL`, `VIBRATE`, `SILENT`) MUST be recorded immediately before triggering prayer silence. When the prayer window elapses, the device is restored strictly to the recorded initial state. If the device was already on Silent or Vibrate prior to Jammat, it MUST NOT be forced into Ringing/Normal mode.
   - **Platform-Conscious Architecture (Android vs iOS)**:
     - *Android*: Fully automated via custom native Kotlin TurboModule using `NotificationManager` (`ACCESS_NOTIFICATION_POLICY`), `AudioManager`, and `AlarmManager.setExactAndAllowWhileIdle()`.
     - *iOS Sandbox Limit*: Apple iOS strictly prohibits third-party apps from programmatically flipping the hardware silent switch or controlling system Focus/DND modes in the background. The app transparently informs iOS users, providing interactive actionable local notifications ("Prayer time started — Turn on Silent/Focus") with Apple Shortcuts integration guidance.
7. **Observability**:
   Every production crash, fatal JS error, and critical API failure must report to Sentry with sanitized breadcrumbs (zero PII, scrubbed authorization headers).

---

## 4. Key Mobile Screen Specifications

```
+-------------------------------------------------------+
|  [Navbar: Logo, Search, City Filter, Locate Me]       |
+-------------------------------------------------------+
|  [Live Next Jammat Banner: Countdown to Maghrib]     |
+-------------------------------------------------------+
|  [Auto-Silent Armed Pill: (•) Auto-Silent: 10m Active]|
+-------------------------------------------------------+
|  [Horizontal Scroll: Amenity Chips (Women, AC, Pkg)]  |
+-------------------------------------------------------+
|  [Counter Bar: "12 Mosques Discovered"]               |
+-------------------------------------------------------+
|                                                       |
|  [MosqueCard (Shopify FlashList)]                     |
|  +-------------------------------------------------+  |
|  | Baitul Mukarram National Mosque     450 m [Follow] |
|  | Topkhana Road, Dhaka            [Verified Timetable]|
|  | +-------+-------+-------+-------+-------+       |  |
|  | | Fajr  | Zuhr  | Asr   | Maghr | Isha  |       |  |
|  | | 05:15 | 13:30 | 16:45 | 18:15 | 20:00 |       |  |
|  | +-------+-------+-------+-------+-------+       |  |
|  +-------------------------------------------------+  |
|                                                       |
+-------------------------------------------------------+
|            [ Floating Pill: (•) List | Map ]          |
+-------------------------------------------------------+
```

### Screen 1: Home Screen (List & Map Dual-Mode)
- **Top Bar**: Search bar with real-time text debounce, GPS "Locate Me" button, followed filter toggle.
- **Prayer Countdown Banner**: Dynamically calculates the nearest upcoming Jammat time for the top followed mosque and renders an active 1-second countdown ticker.
- **Auto-Silent Status Pill**: Subtly indicates automation readiness: *"Auto-Silent: Armed for Asr (16:45)"* or *"Auto-Silent Active: Restoring in 7m"*.
- **Horizontal Filter Scroll**: Quick-toggle pills for *Women's Area*, *Air Conditioning*, *Wheelchair Access*, *Parking Space*, and *Following Only*.
- **Feed Virtualization**: Powered by `@shopify/flash-list` with recycled cell views (`estimatedItemSize: 180`) to ensure smooth 60 FPS scrolling even with 500+ mosques in memory.
- **Floating Bottom Toggle Pill**: Centered floating pill `[List (N) | Map]` switching instantly between the FlashList and the full-screen interactive OpenStreetMap view.

### Screen 2: Interactive OpenStreetMap Screen
- Interactive vector/raster tiles with smooth pinch-to-zoom and pan.
- Custom circular pins (`.custom-mosque-pin`):
  - Black pin (`#111114`) with white border for standard mosques.
  - Emerald highlighted pin (`#059669`) for followed or currently active mosques.
- Contributor Pin-Drop mode: Crosshair pin in center of map with lat/long readouts and an "Establish Mosque Here" action pill.

### Screen 3: Mosque Detail Sheet (`@gorhom/bottom-sheet`)
- Smooth interactive bottom-sheet modal sliding over the map/list (`snapPoints: ['50%', '90%']`).
- Full 5-prayer Jamaat breakdown + Taraweeh / Tahajjud notices.
- Verified Staff Roster cards with member photo, verified title, and role status (ADR-024).
- Extensible facilities list displaying available amenities (ADR-025).
- Official announcements board with urgent broadcast banners (ADR-011).
- Multi-signatory donation channel details with 1-tap mobile banking number copy (bKash, Nagad, Bank account) and executive verification green ticks (ADR-028).

### Screen 4: Prayer Auto-Silent & DND Management Modal
- **Master Toggle**: Enable/Disable automated Jammat silence.
- **Per-Waqt Automation Toggles**: Independent enable/disable toggles for each prayer (Fajr, Zuhr, Asr, Maghrib, Isha, Jumu'ah).
- **Custom Duration Selector**: Pill selector for prayer duration: `5 min`, `10 min` (default), `15 min`, `20 min`, or custom input.
- **Pre-Jammat Buffer**: Option to silence 1–2 minutes before Jammat starts.
- **Prior-State Safety Notice**: Explicit explanation that pre-existing Silent or Vibrate states are preserved and never overridden to loud ringer.
- **Android DND Permission Onboarding**: One-tap trigger opening system `ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS` with clear Ferio guidance screen.
- **iOS Informational Card**: Clear platform note explaining iOS hardware switch restrictions and offering 1-tap Shortcuts setup.

### Screen 5: Mosque Notice Board & Announcements Hub Modal (`NoticeBoardModal.tsx`)
- **Urgent Broadcast Banners**: Highlights urgent alerts (`URGENT`) with red/amber badges at the top of the feed and sheet (`ADR-044`).
- **Category Taxonomy**: Displays notices across `JANAZAH`, `EID_PRAYER`, `RAMADAN`, `FRIDAY_KHUTBAH`, and `GENERAL_NOTICE`.
- **Event Schedule Tags**: Displays event date/time metadata alongside the author/committee attribution.
- **Offline Cache**: Preserves notices in synchronous storage so worshippers can review funeral or prayer notices without active connectivity.

### Screen 6: Crowdsourced Issue Reporting & Delisting Safeguards Modal (`ReportIssueModal.tsx`)
- **ADR-020 & ADR-045 Parity**: Eliminates rigid admin verification gates; mosques are listed by default with community monitoring.
- **5 Report Categories**: `PRAYER_TIME`, `LOCATION`, `CLOSED_MOSQUE`, `DUPLICATE`, and `OTHER`.
- **Anti-Vandalism Protections**: Disallows single-report automated delisting; requires verified moderator confirmation for status transitions.
- **Optimistic Confirmation**: Submits to `POST /api/v1/mosques/:id/reports` with graceful feedback.

### Screen 7: Real-Time Sensor-Fused Great-Circle Qibla Compass (`QiblaCompassModal.tsx`)
- **Great-Circle Geodesic Calculation**: Computes exact Kaaba bearing ($\approx 277.8^\circ$ WNW from Dhaka, $\approx 5,142$ km) using true spherical trigonometry.
- **Sensor Fusion**: Integrates device magnetometer with smoothing filter for flutter-free needle movement (`ADR-046`).
- **Ferio Compass Dial**: High-contrast dark dial (`#111114`) with emerald heading needle and green alignment pulse when facing within $\pm 3^\circ$ of Kaaba.

### Screen 8: Mosque Leadership & Verified Staff Directory (`LeadershipRosterCard.tsx`)
- **Role Taxonomy**: Displays official titles: Khatib, Senior Pesh Imam, Assistant Imam, Muazzin, Khadem, President, Mutawalli (`ADR-047`).
- **Verification Green Ticks**: Visual checkmark badge (`✓ Verified Staff`) confirming committee-endorsed personnel.
- **Direct Telephone Dialer**: 1-tap phone trigger linking to native device dialer with sanitized tel: protocol.

### Screen 9: Bilingual Localization & Musalli Terminology (`LocalizationService.ts`)
- **Native Musalli Lexicon**: Pure Islamic/Bangla terminology: ওয়াক্ত, জামাত, আজান, খতিব, কিবলা, অনুদান (`ADR-048`).
- **1-Tap Navbar Switcher**: Compact pill in top navbar (`বাং | EN`) instantly flipping language synchronously across all components without app reload.
- **Eastern Arabic / Bangla Numerals**: Utility converting timestamps and counts into Bangla numerals (`১২:৪৫`, `১,৫০০`).

### Screen 10: Daily Authentic Hadith & Reflection Digest (`DailyHadithCard.tsx`)
- **Verified Hadith Pool**: Canonical reflections with Arabic, Bangla, and English translations from Sahih Bukhari, Sahih Muslim, and Sunan an-Nasa'i (`ADR-049`).
- **Deterministic Day-of-Year Rotation**: Uniform national reflection across all Bangladeshi users on any given calendar day.
- **Collapsible UI**: Positioned in feed header beneath countdown banner with local collapse memory and native share sheet trigger.

### Screen 11: Extensible Facilities Taxonomy & Suggest Facilities Sheet (`FacilitiesCard.tsx`, `SuggestFacilitiesModal.tsx`)
- **ADR-025 Parity**: Full architectural parity with web facilities catalog and dedicated suggestion flow.
- **Canonical Metrics**: Capacity counter, separate wudu spots, female prayer area, AC, wheelchair access, janaza staging, parking.
- **Extensible Amenities Tags**: Renders custom chips (Solar Power, Elevator, CCTV, Chilled RO Water, IPS/Generator, Musafir Khana).
- **Dedicated Community Suggestion Modal**: Dedicated sheet with switches, catalog chips, and custom tag input transmitting to `POST /mosques/:id/suggestions`.

### Screen 12: Verified Multi-Signatory Donation Channels Hub (`DonationChannelsCard.tsx`)
- **ADR-028 Parity**: Worshippers see official committee accounts with verified multi-signatory endorsement consensus.
- **Financial Brand Tokens**: Branded badges for bKash (`#e2136e`), Nagad (`#ea580c`), Rocket (`#7c3aed`), and Bank Transfer (`#0f766e`).
- **Multi-Signatory Attestation Badges**: Distinct visual ticks (`✓ President`, `✓ Gen. Secretary`, `○ Mutawalli`).
- **Fraud Safety Disclosures**: Personal accounts trigger explicit warning banners advising donors to verify with the committee before large transfers.
- **1-Tap Clipboard Copier**: Instant copy with visual state confirmation and USSD code prompts (`*247#`, `*167#`).

### Screen 13: Categorized Collections & Routine Bookmarks (`CollectionFilterBar.tsx`, `CollectionTagModal.tsx`)
- **ADR-052 & ADR-013 Parity**: Multi-tag categorization matching worshipper commuting routines (🏠 Home, 🏢 Work, 🕌 Jumu'ah, ⭐ Saved).
- **Contextual Feed Filter Bar**: Instant horizontal pill switcher filtering feed with zero network latency.
- **Interactive Tagging Sheet**: Multi-select assignment sheet with instant local storage synchronization.

### Screen 14: Contributor Pin-Drop & Proximity Duplicate Detection (`AddMosqueSheet.tsx`)
- **ADR-005 & ADR-043 Parity**: Crosshair pin-drop mode allowing community scouts to establish new mosques.
- **$\le 150$m Proximity Duplicate Check**: Warns contributors before creating duplicates, displaying existing nearby candidates.
- **Multi-Step Sheet**: Guided flow collecting name, address, initial Jamaat timings, and optional facilities.

### Screen 15: OEM Battery Optimization Mitigation Wizard (`OemOptimizationModal.tsx`)
- **ADR-037 Parity**: Detects aggressive battery killers (Xiaomi HyperOS, Realme ColorOS, Samsung OneUI) and guides users to whitelist the app for reliable prayer alarms.

---

## 5. Non-Functional & Enterprise Platform Requirements

### 5.1. Performance & Hardware Target Budgets
- **Hardware Minimum Baseline**: Android 8.0+ (API 26), 2GB RAM, Quad-core 1.5 GHz MediaTek/Unisoc chipset.
- **Cold App Launch Time**: $< 1.5$ seconds to first interactive frame on low-end hardware.
- **Warm App Launch Time**: $< 400$ ms.
- **Frame Rate**: Sustained $58$–$60$ FPS during fast list fling gestures.
- **Memory Footprint**:
  - Idle: $\le 65$ MB.
  - Active Map Streaming: $\le 115$ MB.
  - Peak limit before triggering memory warning: $150$ MB.
- **App Download Size**: Android App Bundle (`.aab`) download size $< 18$ MB.

### 5.2. Network & Synchronization Resilience
- **Transport**: TanStack Query v5 with stale-while-revalidate (`staleTime: 5 mins`, `gcTime: 24 hours`).
- **Retry Strategy**: Exponential backoff (1s, 2s, 4s, 8s) up to 3 attempts on network error.
- **Offline Mutation Queue**: Actions performed offline (e.g. toggling attendance or bookmarking) are queued in MMKV and replayed idempotently upon reconnect.

### 5.3. Security & Compliance
- **Credential Storage**: Access & Refresh tokens encrypted in Android KeyStore / iOS Keychain via `expo-secure-store`.
- **Network Security**: Enforce TLS 1.3 / HTTPS across all production endpoints; reject plain HTTP traffic in release builds.
- **Data Scrubbing**: Sentry crash logs must automatically scrub `Authorization` headers, passwords, and phone numbers before transmission.

### 5.4. Background Alarm & Battery Killer Mitigation
- **Alarm Driver**: `@notifee/react-native` configured for `SCHEDULE_EXACT_ALARM` (Android 12–13) and `USE_EXACT_ALARM` (Android 14+).
- **OEM Whitelist Wizard**: In-app prompt detecting aggressive OEM battery managers (Xiaomi HyperOS/MIUI, Oppo/Realme ColorOS, Samsung OneUI) guiding users to toggle "Allow Background Activity".

### 5.5. Native Auto-Silent Engine & DND Automation
- **Native Driver (Android)**: Custom Kotlin TurboModule (`AndroidAutoSilentManager`) registered via Expo Config Plugin.
- **System APIs**:
  - `NotificationManager.isNotificationPolicyAccessGranted()` for DND authorization.
  - `AudioManager.setRingerMode(AudioManager.RINGER_MODE_SILENT)` and `NotificationManager.setInterruptionFilter(INTERRUPTION_FILTER_NONE | INTERRUPTION_FILTER_PRIORITY)`.
- **Exact Execution**: Scheduled via `AlarmManager.setExactAndAllowWhileIdle()` to guarantee wakeups during Android Doze mode.
- **State Resilience**: Stores `previousRingerMode` synchronously in `MMKV` / encrypted `SharedPreferences` so process restarts or low-memory kills never lose the initial state.
- **Device Reboot Listener**: `BOOT_COMPLETED` BroadcastReceiver automatically reschedules the day's silent and restore alarms after phone restart.

---

## 6. Complete Feature & Backend API Traceability Matrix

| Web Feature Spec | Platform ADR | Mobile Screen / Component | Backend API Endpoint | HTTP Method | Data Payload / DTO | Invariant & Security Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-001**: Nearby Mosques | ADR-002, ADR-030 | `App.tsx`, `MosqueCard.tsx` | `/mosques/nearby` | `GET` | `?lat=&lng=&radiusMeters=` | PostGIS spatial index, bounded $\le 50$ results |
| **F-002**: Mosque Registry | ADR-001, ADR-031 | `MosqueDetailSheet.tsx` | `/mosques/:id` | `GET` | None | Sovereign PostgreSQL record, non-blocking |
| **F-005**: Add Mosque Pin | ADR-005, ADR-043 | `AddMosqueSheet.tsx` | `/mosques` | `POST` | `CreateMosqueDto` | $\le 150$m duplicate check, contributor provenance |
| **F-007**: Prayer Timetable | ADR-007, ADR-036 | `TimetableUpdateModal.tsx` | `/mosques/:id/prayer-schedule` | `PUT` | `UpdatePrayerScheduleDto` | Immediate update, 5 waqts + Jumu'ah validated |
| **F-008**: Freshness History | ADR-007, ADR-030 | `FreshnessBadge.tsx` | `/mosques/:id/freshness` | `GET` | `FreshnessMetadata` | Stored timestamp derived, 90d/180d freshness |
| **F-009**: User Attendance | ADR-024, ADR-035 | `AttendanceAffiliationCard.tsx`| `/mosques/:id/attendance` | `PUT` / `DELETE`| `{ status: 'REGULAR'/'OCCASIONAL' }` | `@@unique([userId, mosqueId])`, dual count |
| **F-010**: Staff Directory | ADR-024, ADR-047 | `LeadershipRosterCard.tsx` | `/mosques/:id/staff` | `GET` | `MosqueStaffMember[]` | Verified checkmark badge, direct tel: dialer |
| **F-013**: Mosque Reports | ADR-020, ADR-045 | `ReportIssueModal.tsx` | `/mosques/:id/reports` | `POST` | `CreateReportDto` | 5 report types, delisting protection |
| **F-021**: Mosque Facilities | ADR-010, ADR-050 | `FacilitiesCard.tsx` | `/mosques/:id/facilities` | `GET` | `MosqueFacility` | Total capacity, wudu, AC, wheelchair access |
| **F-022**: Announcements | ADR-011, ADR-044 | `NoticeBoardModal.tsx` | `/mosques/:id/announcements`| `GET` | `MosqueAnnouncement[]` | Priority badges (`URGENT`), event date/time |
| **F-025**: Extensible Facilities| ADR-025, ADR-050 | `SuggestFacilitiesModal.tsx`| `/mosques/:id/suggestions` | `POST` | `suggestedFacilities` | Catalog chips + custom tags ($\le 20$ tags) |
| **F-028**: Verified Donations | ADR-028, ADR-051 | `DonationChannelsCard.tsx` | `/mosques/:id/donations` | `GET` | `MosqueDonationMethod[]` | Multi-signatory badges, personal account alert |
| **F-030**: Mosque Follows | ADR-013, ADR-052 | `CollectionFilterBar.tsx` | `/mosques/:id/follow` | `POST` | None | Synchronous MMKV routine tags (Home, Work) |
| **Mobile Extra**: Auto-Silent | ADR-034 | `AutoSilentSettingsModal.tsx`| Native TurboModule | Native | System DND / Audio Manager | Prior-state preservation, reboot receiver |
| **Mobile Extra**: Qibla Compass| ADR-046 | `QiblaCompassModal.tsx` | Sensor Fusion Engine | Client | Magnetometer / Accelerometer | Great-Circle Kaaba azimuth ($277.8^\circ$ WNW) |
| **Mobile Extra**: Localization | ADR-048 | Top Navbar Switcher | `LocalizationService.ts` | Client | Synchronous Dictionary Map | Bilingual Musalli terminology (`বাং | EN`) |
| **Mobile Extra**: Daily Hadith | ADR-049 | `DailyHadithCard.tsx` | `HadithService.ts` | Client | Deterministic Day Rotation | Authenticated Sahih citations, native share |

