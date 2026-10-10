# ADR-029: Cross-Platform Mobile Application Architecture with React Native, Expo, and Enterprise Offline-First Hardening

## Status
**Accepted**

## Date
2026-10-05

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
With the core web platform operational (NestJS/Prisma backend, Next.js frontend, PostgreSQL/PostGIS spatial registry), there is a strategic mandate to introduce an enterprise-grade native mobile client for Android and iOS that delivers:
1. **Pixel-Perfect Visual Parity with the Web Client**: Faithful adherence to the *Ferio Visual Language* defined in `.agents/skills/ferio-frontend-design/SKILL.md` (monochrome `#111114` / `#6e6e73` / `#e8e8ea` / `#fafafa` palette, hairline borders, 10–12px card radii, pill action buttons, and zero decorative glassmorphism or shadows).
2. **First-Class OpenStreetMap Integration**: Unrestricted access to OpenStreetMap raster tiles, custom mosque pins, and contributor pin-drop functionality without Google Maps API cost bottlenecks.
3. **Bangladeshi Mobile Device Realities**: Flawless, memory-efficient operation on low-to-mid range Android devices (e.g., Walton, Symphony, Redmi, Realme with 2GB–4GB RAM) common across Bangladesh.
4. **Reliable Local Prayer / Jammat Reminders**: Support for exact, battery-optimized background alarms (`SCHEDULE_EXACT_ALARM`) for Azan and Jammat count-downs independent of central push servers.
5. **Engineering Velocity & Maintenance**: Avoiding the organizational overhead of maintaining two completely distinct tech stacks (TypeScript for web/backend vs. Dart for mobile).

### Evaluation: React Native (Expo) vs. Flutter
- **Flutter (Dart 3+)**: High-performance Skia/Impeller canvas rendering and stellar OpenStreetMap support (`flutter_map`). However, it introduces an entirely separate programming language (Dart), requiring a 100% duplicate rewrite of existing TypeScript API clients (1,379 lines in `lib/api.ts`), domain models (`types/mosque.ts`), and date/time calculation math, with zero CSS/Tailwind class sharing.
- **React Native (Expo SDK 52+ with New Architecture & NativeWind v4)**: Unified TypeScript stack, near-total business logic reuse (`api.ts`, `types/mosque.ts`, prayer countdown math), 1:1 Tailwind utility mapping via NativeWind v4, and 60 FPS scrolling performance using Shopify's `FlashList` with Hermes engine.

To meet **enterprise-grade production standards**, the baseline React Native architecture must address 6 real-world failure modes:
1. **Flaky Network Transport**: Raw `fetch + useState` fails under cellular instability.
2. **Storage Bottlenecks**: `AsyncStorage` chokes on hundreds of cached mosques and spatial data.
3. **Credential Vulnerability**: Storing auth tokens in plaintext storage leaves them exposed on rooted devices.
4. **MapLibre Compatibility**: Native map drivers cannot run in Expo Go and require native config plugins and development builds (`expo-dev-client`).
5. **OEM Background Task Termination**: Aggressive battery savers in Xiaomi, Oppo, and Samsung kill background alarms.
6. **Blind Telemetry**: Lack of crash reporting leaves production bugs invisible.

---

## Decision

The platform adopts **React Native with Expo (SDK 52+, New Architecture enabled)** with an **enterprise-hardened offline-first architecture**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ENTERPRISE MOBILE CLIENT ARCHITECTURE                │
├────────────────────────────────────────────────────────────────────────┤
│ Presentation:  NativeWind v4 (Ferio Design Tokens) + FlashList         │
│ Navigation:    Expo Router v4 / React Navigation (Typed Routes)        │
│ Modals/Sheets: @gorhom/bottom-sheet (Native gesture-driven)            │
│ State/Network: TanStack Query v5 (Deduping, Stale-While-Revalidate)    │
│ Security:      expo-secure-store (Hardware Keystore / Keychain)        │
│ Fast Cache:    react-native-mmkv (Synchronous Key-Value)               │
│ Structured DB: expo-sqlite (Indexed offline spatial & schedule cache)  │
│ Map Engine:    @maplibre/maplibre-react-native (OSM Raster Tiles)      │
│ Alarms:        @notifee/react-native (Exact alarms + OEM battery flow) │
│ Auto-Silent:   Android Kotlin TurboModule (DND + State-Preserving Alarm)│
│ Telemetry:     @sentry/react-native (Crash reporting + Breadcrumbs)    │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Enterprise Component & Dependency Standards

| Architectural Concern | Selected Enterprise Solution | Hardened Rationale |
| :--- | :--- | :--- |
| **Framework Runtime** | Expo SDK 52+ / React Native 0.76+ | Bridgeless Mode, TurboModules, Hermes AOT compilation by default. |
| **Build & Compilation** | Expo Prebuild (`expo-dev-client`) | Replaces Expo Go. Enables native MapLibre, Notifee, and Kotlin modules via Config Plugins. |
| **Network & Sync Engine** | **TanStack Query v5** (`@tanstack/react-query`) | Handles query deduping, background refetching on AppState resume, exponential backoff retries, and offline mutation queues. |
| **Secure Token Storage** | **`expo-secure-store`** | Stores JWT Access/Refresh tokens in hardware-backed Android KeyStore / iOS Keychain. |
| **High-Speed State Cache** | **`react-native-mmkv`** | 30x faster than AsyncStorage. Zero JNI/Bridge latency for user preferences, followed IDs, and sync flags. |
| **Structured Offline Store** | **`expo-sqlite`** | Caches full mosque records, geo-bounding boxes, and prayer schedules with SQL indexing; prevents JS thread stalls. |
| **Design System** | **NativeWind v4** | 1:1 mapping with web Tailwind utility classes and Ferio color tokens (`#111114`, `#6e6e73`, `#e8e8ea`, `#fafafa`). |
| **List Virtualization** | **`@shopify/flash-list`** | Aggressive cell recycling; sustains 60 FPS with estimated item sizes on 2GB RAM devices. |
| **Geospatial Map Driver** | **`@maplibre/maplibre-react-native`** | Hardware-accelerated OpenGL/Metal tile rendering for OpenStreetMap; zero Google Maps billing. |
| **Sheet Interactions** | **`@gorhom/bottom-sheet`** | Reanimated 3 fluid bottom-sheet modals with native gesture handling. |
| **Background Alarms** | **`@notifee/react-native`** | Manages Android `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` with OEM battery optimization bypass guidance. |
| **Prayer Auto-Silent** | **Custom Kotlin TurboModule** (`AndroidAutoSilentManager`) | Automates Do Not Disturb (`ACCESS_NOTIFICATION_POLICY`) and silent ringer during Jammat, restoring saved prior state after custom duration (e.g. 10m). iOS delivers actionable Focus notifications due to Apple sandbox constraints. |
| **Observability & Health** | **`@sentry/react-native`** | Full-stack crash reporting, JS/native stack traces, offline state breadcrumbs, and sanitized network logs. |

### 2. Code Sharing & Architecture Boundaries
- **Monorepo / Shared Layer**: The mobile application consumes identical TypeScript types (`types/mosque.ts`), API contracts, and algorithmic helpers (`lib/time.ts`, countdown calculations) from the shared codebase.
- **Server-Side Sovereign Invariants**: The mobile application is strictly an untrusted client. All authorization, geospatial bounding queries, duplicate detection, and moderation state transitions remain solely enforced by the NestJS/PostGIS backend. No business logic or moderation authority is delegated to the mobile client.
- **Offline Resilience Invariant**: When internet connectivity drops, the client automatically transitions to local SQLite cache, displaying an explicit "Offline — using cached schedule" indicator.

---

## Consequences

### Positive
- **True Enterprise Robustness**: Eliminates frame drops, unhandled network failures, and token theft vectors.
- **Massive Time-to-Market Advantage**: Enables up to 80% code reuse for data fetching, serialization, authentication headers, error envelopes, and date-time logic.
- **Single Language Mastery**: A single engineering team proficient in TypeScript can develop, review, and maintain backend, web frontend, and mobile apps concurrently.
- **Exact Ferio Design Parity**: NativeWind v4 allows using identical CSS class names (`rounded-2xl`, `border border-[#e8e8ea]`, `bg-[#fafafa]`, `text-[#111114]`), eliminating style divergence.
- **Cost Efficiency**: OpenStreetMap tile rendering ensures the platform remains free of prohibitive map SDK license fees.
- **Budget Hardware Optimization**: Hermes + MMKV + FlashList guarantees smooth list animations on low-spec devices prevalent in Bangladesh.

### Negative / Trade-offs
- **Expo Go Incompatible**: Developers cannot use the standard Expo Go mobile app because native modules (MapLibre, Notifee) require custom development builds (`npx expo run:android` / `npx expo run:ios`).
- **Android Policy Governance**: Requires rigorous adherence to Google Play policies regarding exact alarms and foreground location disclosures.

---

## Compliance Requirements
1. **No Design Drift**: Any new mobile screen or component must be reviewed against `.agents/skills/ferio-frontend-design/SKILL.md`. Decorative glassmorphism, bright saturated brand gradients, or heavy drop shadows are strictly prohibited.
2. **Hermes & New Architecture**: The project must keep Hermes and the React Native New Architecture enabled; legacy bridge mode is not supported.
3. **FlashList Mandatory**: All scrolling lists containing mosques, announcements, staff rosters, or search results must use `@shopify/flash-list`. Standard `ScrollView` or `FlatList` for dynamic data is disallowed.
4. **Hardware Token Storage**: Auth tokens must NEVER be stored in MMKV or plain AsyncStorage; `expo-secure-store` is mandatory.
5. **Backend Invariant Integrity**: The mobile app must communicate strictly via `/api/v1` REST endpoints, passing Bearer JWT tokens in `Authorization` headers as standardized in ADR-003 and ADR-007.
