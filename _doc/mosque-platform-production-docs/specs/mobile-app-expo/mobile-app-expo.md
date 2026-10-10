---
id: F-040
name: Cross-Platform Mobile Client (React Native & Expo SDK 52+)
phase: 4
status: completed
depends_on:
  - F-001
  - F-002
  - F-003
  - F-004
  - F-005
  - F-007
  - F-008
  - F-009
  - F-021
  - F-022
  - F-030
  - F-031
blocks: []
parallel_with: []
source:
  - 01-PRD-PRODUCTION.md#product-vision
  - 07-RELEASE-PLAN.md#release-4-mobile
  - ADRs/ADR-029-cross-platform-mobile-client-react-native-expo.md
  - specs/mobile-app-expo/PRD-MOBILE-APP.md
---

# Feature Specification: Cross-Platform Mobile Client (React Native & Expo SDK 52+)

## 1. Overview
This specification details the enterprise-grade engineering implementation for the BD Masjid cross-platform mobile client for Android and iOS using **React Native with Expo SDK 52+**. 

The mobile application replicates 100% of the web frontend's visual language (*Ferio Minimalist System* per `.agents/skills/ferio-frontend-design/SKILL.md`), utilizes OpenStreetMap raster tiles for geospatial exploration, shares the existing TypeScript domain models, and implements an enterprise-grade mobile resilience stack:
- **TanStack Query v5** for request deduping, background synchronization, and automatic retries.
- **Tiered storage architecture**: Hardware-backed KeyStore (`expo-secure-store`), synchronous memory-mapped flags (`react-native-mmkv`), and structured indexed offline caching (`expo-sqlite`).
- **Low-end hardware optimization**: Shopify `FlashList` for 60 FPS scrolling on 2GB RAM budget Android hardware.
- **Battery-safe exact prayer alarms**: `@notifee/react-native` with OEM battery management mitigation.
- **Production telemetry**: Full-stack crash reporting and breadcrumbs via `@sentry/react-native`.

---

## 2. Business & Architectural Invariants

1. **Zero Server Invariant Migration**: The mobile application is strictly an untrusted presentation layer. All geospatial boundary filtering, duplicate detection (ADR-005), role verification (ADR-003, ADR-019), and moderation rules remain solely enforced by the NestJS/PostGIS backend.
2. **Design Language Conformance (Ferio Standard)**:
   - Base Palette: `#111114` (primary text/buttons), `#6e6e73` (muted text/icons), `#e8e8ea` (borders/dividers), `#fafafa` (canvas), `#ffffff` (cards).
   - Accents: Emerald (`#059669`) for active/verified states; Amber/Rose for stale timetables.
   - Geometry: 10px–16px card radii (`rounded-2xl`), hairline 1px borders, rounded-full pill buttons.
   - Prohibitions: No glossy gradients, glassmorphism, heavy drop shadows, or non-system font families.
3. **OpenStreetMap Independence**: Base maps must be served from OpenStreetMap tile servers with local caching. Google Maps SDK billing and proprietary API keys are strictly excluded.
4. **List Performance on Low-End Devices**: Every scrollable feed of mosques, staff members, or announcements must use `@shopify/flash-list` with estimated item sizes to prevent memory leaks and frame drops on 2GB RAM Android hardware.
5. **Offline-First Resilience**: When network connectivity is lost, the client must seamlessly present cached followed mosques and prayer schedules from local SQLite storage, accompanied by an explicit offline status indicator.
6. **Battery-Safe Exact Alarms**: Local Jammat and Azan reminders must be scheduled via system AlarmManager (`SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`) without running persistent background service loops or continuous polling.
7. **Secure Token Storage**: Authentication tokens must never be written to plaintext storage; hardware-backed `expo-secure-store` is mandatory.
8. **Prayer Auto-Silent & Prior-State Invariant**:
   - The device's initial ringer state (`NORMAL`, `VIBRATE`, `SILENT`) MUST be recorded immediately prior to triggering prayer silence.
   - When the prayer duration window elapses, the device is restored strictly to the recorded initial state. If the device was already on Silent or Vibrate prior to Jammat, it MUST NOT be forced into Ringing/Normal mode.
   - *Android*: Fully automated via custom native Kotlin TurboModule using `NotificationManager` (`ACCESS_NOTIFICATION_POLICY`), `AudioManager`, and `AlarmManager.setExactAndAllowWhileIdle()`.
   - *iOS*: Due to Apple sandbox restrictions prohibiting 3rd-party programmatic silent switch toggling, iOS presents actionable local notifications with Apple Shortcuts automation integration.

---

## 3. Native Architecture & Tech Stack

```mermaid
graph TD
    subgraph "Mobile Client (React Native / Expo SDK 52)"
        A["App Root (Expo Router v4)"] --> B["Design System (NativeWind v4 + Ferio Tokens)"]
        A --> C["Presentation Layer (FlashList + Gorhom Bottom Sheet)"]
        A --> D["Map Engine (@maplibre/maplibre-react-native)"]
        A --> E["Data & Sync Engine (TanStack Query v5)"]
        
        E --> F1["Secure Store: JWT Tokens (expo-secure-store)"]
        E --> F2["Fast KV: UI Flags & Sync State (react-native-mmkv)"]
        E --> F3["Structured DB: Mosques & Schedules (expo-sqlite)"]
        
        A --> G["Native Services (Notifee Alarms + OEM Battery Helper)"]
        A --> H["Native Auto-Silent (Kotlin TurboModule + DND Manager)"]
        A --> I["Telemetry (@sentry/react-native)"]
    end

    subgraph "Transport & Backend"
        E -->|HTTP / JSON + Bearer JWT| J["NestJS API (/api/v1)"]
        J --> K["PostgreSQL + PostGIS"]
    end
```

### Component Breakdown
| Enterprise Concern | Technology Choice | Production Rationale |
| :--- | :--- | :--- |
| **Framework Runtime** | Expo SDK 52+ / React Native 0.76+ | Bridgeless Mode, TurboModules, Hermes AOT compilation by default. |
| **Build & Compilation** | Expo Prebuild (`expo-dev-client`) | Enables native MapLibre, Notifee, and custom Kotlin modules via Config Plugins. |
| **Network & Sync Engine** | **TanStack Query v5** | Query deduping, background sync on AppState focus, exponential retries. |
| **Secure Token Storage** | **`expo-secure-store`** | Hardware-backed KeyStore/Keychain encryption for auth tokens. |
| **High-Speed Cache** | **`react-native-mmkv`** | 30x faster synchronous key-value store for preferences and sync timestamps. |
| **Structured Offline Store** | **`expo-sqlite`** | Caches full mosque records and schedules with indexing; zero JS thread stalls. |
| **Styling & Tokens** | **NativeWind v4** (TailwindCSS) | 1:1 class name parity with existing Next.js Tailwind markup. |
| **List Virtualization** | **`@shopify/flash-list`** | Aggressive cell recycling; sustains 60 FPS on 2GB RAM budget hardware. |
| **Interactive Map** | **`@maplibre/maplibre-react-native`** | Hardware-accelerated OpenGL/Metal rendering of OpenStreetMap tiles. |
| **Modals / Sheets** | **`@gorhom/bottom-sheet`** | Reanimated 3 fluid bottom-sheet modals with native gesture handling. |
| **Prayer Alarms** | **`@notifee/react-native`** | Reliable exact alarms for Android 12–15 with OEM battery bypass guidance. |
| **Prayer Auto-Silent Engine** | **Custom Kotlin TurboModule** (`AndroidAutoSilentManager`) | Native Android DND (`ACCESS_NOTIFICATION_POLICY`), `AudioManager.RINGER_MODE_SILENT`, exact `AlarmManager` restore timer, and prior-state safety. |
| **Observability** | **`@sentry/react-native`** | Real-time crash telemetry, sanitized breadcrumbs, and performance tracking. |

---

## 4. API Endpoints Consumed (Existing NestJS Backend)

The mobile client interacts exclusively with existing production endpoints:
- `GET /api/v1/mosques/nearby?lat={lat}&lng={lng}&radiusMeters={radius}` — Spherical radial search.
- `GET /api/v1/mosques/search?q={query}&city={city}` — Text search and facility filters.
- `GET /api/v1/mosques/:id` — Full mosque profile with schedule and facilities.
- `POST /api/v1/mosques` — Contributor mosque creation with duplicate check.
- `GET /api/v1/mosques/user/followed` — User's followed mosques.
- `POST /api/v1/mosques/:id/follow` — Follow/unfollow toggle.
- `POST /api/v1/mosques/:id/attendance` — Regular/occasional attendance toggle.
- `GET /api/v1/announcements/mosque/:mosqueId` — Active official announcements.
- `GET /api/v1/donations/mosque/:mosqueId` — Verified donation channels with creator provenance.

---

## 5. Implementation Slices & Proof Matrix

### TK-MOB-01: Expo Prebuild Scaffolding, NativeWind v4 & Hardware Keystore Token Storage
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Initialize the Expo SDK 52+ application with TypeScript, configure custom development client (`expo-dev-client`) and prebuild config plugins, set up NativeWind v4 with exact Ferio tokens, and configure `expo-secure-store` for hardware-encrypted JWT storage.
- **Acceptance Criteria**:
  - [x] App boots cleanly on physical Android and iOS devices using `expo-dev-client`.
  - [x] Hermes engine and Bridgeless New Architecture active.
  - [x] `tailwind.config.js` configures palette: `#111114`, `#6e6e73`, `#e8e8ea`, `#fafafa`, and `#ffffff`.
  - [x] `expo-secure-store` provides encrypted access token getter/setter with zero plaintext exposure.
- **Target Files**:
  - `mobile/package.json`
  - `mobile/app.json` (config plugins)
  - `mobile/tailwind.config.js`
  - `mobile/src/lib/secureStorage.ts`

### TK-MOB-02: TanStack Query v5 Network Layer, FlashList Virtualization & Live Countdown
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Implement TanStack Query v5 client with exponential backoff and offline persister, build `PrayerCountdownBanner` with 1-second interval ticker, and implement Shopify `FlashList` for `MosqueCard`.
- **Acceptance Criteria**:
  - [x] TanStack Query retries failed queries up to 3 times with exponential backoff on flaky cellular networks.
  - [x] `PrayerCountdownBanner` renders real-time 1-second countdown to next prayer using `lib/time.ts`.
  - [x] Horizontal filter chips allow filtering by *Women's Area*, *AC*, *Wheelchair*, *Parking*, and *Following*.
  - [x] `FlashList` sustains 60 FPS scrolling on memory-constrained 2GB RAM test profiles.
- **Target Files**:
  - `mobile/src/lib/queryClient.ts`
  - `mobile/src/components/PrayerCountdownBanner.tsx`
  - `mobile/src/components/MosqueCard.tsx`
  - `mobile/src/screens/HomeScreen.tsx`

### TK-MOB-03: OpenStreetMap Native MapLibre Engine, Custom Pin Hierarchy & Pin Drop Mode
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Configure `@maplibre/maplibre-react-native` with OpenStreetMap raster tiles, local tile caching, custom circular pins, and contributor pin-drop mode.
- **Acceptance Criteria**:
  - [x] OpenStreetMap raster tiles render crisply without Google Maps SDK dependencies.
  - [x] Custom circular pins reflect followed (`#059669`) and standard (`#111114`) mosque states.
  - [x] Pin drop mode allows dropping a marker with latitude/longitude output for new mosque creation.
  - [x] Floating bottom toggle pill `[List (N) | Map]` toggles viewports smoothly.
- **Target Files**:
  - `mobile/src/components/MosqueMap.tsx`
  - `mobile/src/components/ViewTogglePill.tsx`

### TK-MOB-04: Gesture-Driven Mosque Detail Bottom Sheet & Governance Modals
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Implement `@gorhom/bottom-sheet` featuring facilities, verified staff roster (ADR-024), official announcements (ADR-011), and verified donation channels (ADR-028).
- **Acceptance Criteria**:
  - [x] Bottom sheet expands to 50% and 90% snap points smoothly via gesture drags.
  - [x] Displays verified staff members with photo and official role badges (ADR-024).
  - [x] Displays verified donation accounts with 1-tap copy and green tick leadership indicators (ADR-028).
  - [x] Community suggestion and problem reporting actions open accessible native sub-modals.
- **Target Files**:
  - `mobile/src/components/MosqueDetailSheet.tsx`
  - `mobile/src/components/DonationChannelsList.tsx`
  - `mobile/src/components/ReportModal.tsx`

### TK-MOB-05: Tiered Offline Persistence (MMKV + SQLite) & Resilient Attendance Sync
- **Status**: `[x] Completed` | **Priority**: Medium
- **Description**: Implement high-speed synchronous storage with `react-native-mmkv` and structured SQL caching with `expo-sqlite`, providing seamless offline viewing and idempotent mutation replay upon reconnection.
- **Acceptance Criteria**:
  - [x] Followed mosques and full schedules persist across app restarts in SQLite.
  - [x] Offline banner displays automatically when network is unavailable, serving cached timetables.
  - [x] Attendance toggle mutations queue offline and sync idempotently on reconnect.
- **Target Files**:
  - `mobile/src/lib/database.ts` (SQLite schema & queries)
  - `mobile/src/lib/kvStorage.ts` (MMKV instance)
  - `mobile/src/hooks/useFollowedMosques.ts`

### TK-MOB-06: Background Exact Jammat Alarms, OEM Battery Mitigation & Sentry Telemetry
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Integrate `@notifee/react-native` for exact Jammat reminders, implement OEM battery optimization bypass guidance, and integrate `@sentry/react-native` for sanitized crash reporting.
- **Acceptance Criteria**:
  - [x] Requests required notification and exact alarm permissions on Android 12–15 and iOS.
  - [x] Detects OEM battery savers (Xiaomi, Oppo, Samsung) and presents educational whitelist modal.
  - [x] Alarms trigger precisely 10 minutes prior to Jamaat start with custom sound/vibration.
  - [x] Sentry captures fatal crashes and non-fatal exceptions with sanitized breadcrumbs.
- **Target Files**:
  - `mobile/src/services/alarmService.ts`
  - `mobile/src/services/batteryOptimization.ts`
  - `mobile/src/lib/sentry.ts`

### TK-MOB-07: Android Native Auto-Silent Engine & Prior-State DND Automation
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Implement a native Kotlin TurboModule (`AndroidAutoSilentManager`) using Android `NotificationManager` DND policy access and `AudioManager` to automatically switch the phone into Silent mode during Jammat and restore it to its prior ringer state (Normal/Vibrate/Silent) after a customizable duration (default 10 minutes), with scheduled exact alarms and reboot persistence.
- **Acceptance Criteria**:
  - [x] Android Config Plugin adds `ACCESS_NOTIFICATION_POLICY` and `RECEIVE_BOOT_COMPLETED` permissions.
  - [x] Kotlin TurboModule exposes `checkDndPermission()`, `requestDndPermission()`, `setPrayerSilentMode()`, and `restoreRingerMode()`.
  - [x] Enforces **State Preservation Invariant**: Records device ringer mode (`NORMAL`, `VIBRATE`, `SILENT`) before silencing; restores strictly to saved mode. If phone was already in Silent/Vibrate mode prior to prayer, it is NEVER forced to Ringing/Normal on duration expiry.
  - [x] Alarms scheduled via `AlarmManager.setExactAndAllowWhileIdle()` to guarantee timely execution during Android Doze mode.
  - [x] Boot broadcast receiver reschedules the day's 5 prayer silent/restore windows when device reboots.
  - [x] UI features master toggle, per-waqt switches (Fajr, Zuhr, Asr, Maghrib, Isha), duration selector (5m, 10m, 15m, 20m), and live active status countdown badge.
  - [x] iOS renders an informative card explaining Apple hardware switch constraints with 1-tap actionable local notifications and Apple Shortcuts setup guide.
- **Target Files**:
  - `mobile/plugins/withAndroidAutoSilent.js`
  - `mobile/android/app/src/main/java/org/bdmasjid/autosilent/AndroidAutoSilentModule.kt`
  - `mobile/android/app/src/main/java/org/bdmasjid/autosilent/PrayerSilentReceiver.kt`
  - `mobile/android/app/src/main/java/org/bdmasjid/autosilent/PrayerRestoreReceiver.kt`
  - `mobile/src/components/AutoSilentModal.tsx`
  - `mobile/src/components/AutoSilentStatusBadge.tsx`
  - `mobile/src/hooks/usePrayerAutoSilent.ts`

---

## 6. Release & Production Verification Matrix

| Phase | Architecture Domain | ADR Reference | Status | Verification Gate |
|---|---|---|---|---|
| Phase 1-5 | Core App, FlashList, Detail Sheet, Storage | ADR-029–033 | Complete | Cold Launch < 1500ms, 60 FPS |
| Phase 6-7 | Map & DND Auto-Silent Engine | ADR-034–037 | Complete | Prior-State DND preservation |
| Phase 8-10 | Contributor Pin-Drop, Notice Board, Reports | ADR-043–045 | Complete | Proximity duplicate & offline queue |
| Phase 11-13 | Qibla Compass, Staff Directory, Localization | ADR-046–048 | Complete | Geodesic Kaaba bearing & Bangla i18n |
| Phase 14-16 | Daily Hadith, Facilities, Donations | ADR-049–051 | Complete | Multi-signatory fraud governance |
| Phase 17-20 | Bookmarks, In-App Inbox, Auth, Push Sync | ADR-052–055 | Complete | Secure Token & FCM device registration |
| Phase 21-25 | Provenance, Outbox Sync, Mod Review, Telemetry | ADR-056–059 | Complete | FIFO outbox drain & RBAC role gate |
| Phase 26 | Contributor Activity & Scout Reputation | ADR-060 | Complete | Synchronous cache & gold scout badge |
| Phase 27 | Ramadan Fasting Countdown & Division Timetable | ADR-061 | Complete | 8-Division IFB offsets & live countdown |
| Phase 28 | Division-Level Offline Map Vector Pre-Caching | ADR-062 | Complete | 150MB storage ceiling & chunked tiles |

