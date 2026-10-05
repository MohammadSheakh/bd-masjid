# Enterprise Product Requirements Document (PRD): BD Masjid Mobile Client (Android & iOS)

## 1. Executive Summary & Vision
BD Masjid Mobile is the cross-platform native enterprise companion to the BD Masjid web platform. Built with **React Native / Expo SDK 52+**, it provides worshippers, mosque committees, and community members across Bangladesh with instant access to nearby mosques, live Jammat schedules, reliable local prayer reminders, and crowdsourced mosque verification.

The mobile client maintains **100% visual parity with the Ferio Visual System** (`#111114`, `#6e6e73`, `#e8e8ea`, `#fafafa`), while delivering enterprise-grade mobile engineering:
- Zero-leak server-side invariant model (NestJS/PostGIS sovereign authority).
- Resilient multi-tiered offline storage (MMKV for micro-state, SQLite for spatial/schedule cache).
- Resilient network sync via TanStack Query v5 with automatic retries and deduping.
- Hardware-backed token encryption via Android KeyStore / iOS Keychain (`expo-secure-store`).
- Battery-safe exact prayer alarms with OEM battery killer mitigation (Xiaomi HyperOS, Realme ColorOS, Samsung OneUI).
- Comprehensive crash telemetry via `@sentry/react-native`.
- Rock-solid 60 FPS scrolling on low-end hardware (Walton, Symphony, Redmi 2GB–4GB RAM).

---

## 2. Core User Personas & Mobile Journeys

### Persona A: Daily Worshipper / Commuter (Guest & Registered)
- **Context**: Walking to Jammat in dense urban areas (Dhaka, Chittagong) or rural districts on 2G/3G/4G with frequent network drops.
- **Key Journey**:
  1. Open app $\rightarrow$ instant view of followed mosques served directly from local SQLite cache ($< 50$ ms), while TanStack Query validates updates in the background.
  2. Live `PrayerCountdownBanner` renders real-time 1-second interval countdown to the next Jammat.
  3. Toggle floating bottom pill to `Map` $\rightarrow$ inspect OpenStreetMap raster tiles showing nearby mosque pins.
  4. Tap a mosque $\rightarrow$ swipe up native bottom sheet (`@gorhom/bottom-sheet`) displaying verified timetable, facilities (AC, Women's section, Parking), and attendance counts.
  5. Tap "Follow" $\rightarrow$ local notifications automatically registered for daily Azan/Jammat reminders.

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
6. **Observability**:
   Every production crash, fatal JS error, and critical API failure must report to Sentry with sanitized breadcrumbs (zero PII, scrubbed authorization headers).

---

## 4. Key Mobile Screen Specifications

```
+-------------------------------------------------------+
|  [Navbar: Logo, Search, City Filter, Locate Me]       |
+-------------------------------------------------------+
|  [Live Next Jammat Banner: Countdown to Maghrib]     |
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
