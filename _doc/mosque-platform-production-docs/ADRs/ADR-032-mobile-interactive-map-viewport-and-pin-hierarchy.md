# ADR-032: Mobile Interactive Map Viewport, Custom Pin Hierarchy, and Direct Detail Navigation

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In the BD Masjid mobile application, users switch between a list feed and an interactive map canvas using the floating toggle pill `[List (N) | Map]`. 
For the map viewport (`Phase 3`, `TK-MOB-03`), three core architectural challenges must be resolved:
1. **Pin Visual Hierarchy (ADR-023 Parity)**: The web platform established a strict two-tier circular pin system (`.custom-mosque-pin`):
   - Standard registered mosques: 24px dark circle (`#111114`) with a crisp 1.5px white hairline border.
   - Followed / active mosques: 32px enlarged emerald circle (`#059669`) with high-visibility accent styling.
   - Avoids cluttered proprietary Google Maps markers and heavy icon drop shadows.
2. **Pin Tap Interaction Model**: Traditional maps often require a clumsy two-step tap: first selecting a pin to show a callout card, then tapping the callout to view details. On mobile, users walking to prayer want immediate answers. Tapping any mosque pin should directly open the `MosqueDetailSheet` with full 5-prayer Jammat schedules, staff, and verified donation channels.
3. **Map Canvas Independence**: The map viewport renders OpenStreetMap raster tiles without proprietary API keys or external billing constraints.

---

## Decision

The platform adopts:
1. **High-Contrast Ferio Circular Pin Hierarchy**:
   - `MosquePin`: Reusable native component rendering the 24px standard `#111114` dark circle with white border and 32px emerald `#059669` circle for followed mosques.
   - Accessible touch target ($44\times44$ px touch padding) for reliable finger taps on compact screens.
2. **Direct Pin-to-Detail Interaction**:
   - Tapping any mosque pin directly sets `selectedMosque` and slides up the `MosqueDetailSheet` smoothly over the map canvas.
3. **Contributor Pin-Drop Crosshair Mode**:
   - Includes a native pin-drop mode allowing community scouts to pinpoint coordinates and establish new mosques.

---

## Consequences

### Positive
- **100% Visual Parity**: Replicates the clean, minimalist look of the web platform's Leaflet/OpenStreetMap markers.
- **Instant Speed**: Eliminates intermediary callout taps, giving users 1-tap access to Jammat timetables.
- **Zero Map License Costs**: Completely independent of Google Maps billing.

### Negative / Trade-offs
- Coordinate projection on the native canvas requires accurate bounding box calculations and viewport scaling.
