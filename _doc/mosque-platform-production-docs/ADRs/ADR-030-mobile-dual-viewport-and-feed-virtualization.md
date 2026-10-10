# ADR-030: Mobile Dual-Viewport Navigation, List Virtualization, and Hybrid Offline Fixture Architecture

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
As the cross-platform mobile application (`F-040`) moves from foundation scaffolding into feature presentation, two critical architectural questions arise:
1. **Viewport & Navigation Topology**: Traditional mobile applications often default to multi-tab bottom navigation bars (Tabs: Home, Map, Saved, Settings). However, the BD Masjid web experience is praised for its immediate dual-mode accessibility: a single screen seamlessly toggling between a prayer list and an interactive OpenStreetMap canvas.
2. **Feed Rendering on Low-End Hardware**: Rendering dozens of mosques—each displaying 5-column prayer timetables, amenity badges, and distance chips—causes severe frame drops and out-of-memory (OOM) crashes on budget Android devices (Walton, Symphony, Redmi 2GB RAM) if standard non-virtualized `ScrollView` or uncalibrated `FlatList` is used.
3. **Local Dev & Offline Resilience**: During field testing or when the local NestJS backend is not running, the application must not crash or display raw network error toasts; it must seamlessly fall back to structured local offline fixtures.

---

## Decision

The platform adopts:
1. **Unified Dual-Viewport Navigation with Floating Toggle Pill**:
   - A single-screen architecture featuring a centered floating pill: `[ (•) List (N) | Map ]`.
   - Eliminates bottom tab-bar clutter, maximizes vertical screen real estate for prayer timetables, and aligns 100% with the web platform's mental model.
2. **Recycled Cell Feed Virtualization**:
   - Fast virtualized list rendering with calibrated cell heights (`estimatedItemSize: 180`, `drawDistance: 350`).
   - Ensures memory consumption remains $< 65$ MB idle and sustains 60 FPS scrolling.
3. **Hybrid API Transport with Resilient Offline Fallback**:
   - Network client dynamically targets `EXPO_PUBLIC_API_URL` (defaulting to `http://10.0.2.2:4000/api/v1` for Android emulator or `http://localhost:4000/api/v1` for iOS).
   - If network requests fail due to offline status or unreachable local backend, the app automatically serves structured Bangladeshi mosque fixtures with zero UI breakage.

---

## Consequences

### Positive
- **Visual & Conceptual Parity**: Users moving between web and mobile encounter the identical layout and interaction patterns.
- **Low-End Hardware Safety**: Memory overhead remains bounded regardless of whether 10 or 500 mosques are loaded.
- **Immediate Developer Experience**: The mobile app runs and renders rich realistic data immediately, even before the backend server is started.

### Negative / Trade-offs
- Floating bottom pill requires careful z-index management and safe-area padding so it does not obscure the bottom item in the list or map controls.
