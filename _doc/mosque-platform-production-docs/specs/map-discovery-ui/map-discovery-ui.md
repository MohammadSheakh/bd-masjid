---
id: F-009
name: Interactive Map Discovery UI
phase: 1
status: completed

depends_on:
  - F-004
  - F-005
  - F-007

blocks: []

parallel_with: []

source:
  - 01-PRD-PRODUCTION.md#map-and-spatial-interaction
  - 06-IMPLEMENTATION-CHECKLIST.md#g-map-discovery-ui
---

# Feature Specification: Interactive Map Discovery UI

## 1. Overview
The Interactive Map Discovery UI provides responsive, browser-based spatial exploration of mosques across Bangladesh using dynamic Leaflet maps, custom markers, and location discovery.

## 2. Business Invariants
1. **OSM as Base Layer Only**: OpenStreetMap cartographic raster tiles serve strictly as the visual background. All marker locations and prayer times originate from the platform API.
2. **Graceful Geolocation Fallback**: Browser geolocation is optional. If the user denies location permission, the map smoothly defaults to Dhaka center (23.8103, 90.4125) without error toasts.
3. **Bounded Viewport Queries**: Map movements throttle and bound geospatial queries.
4. **Mobile First & Accessible**: Leaflet map dynamically loaded with SSR disabled to prevent hydration errors.

## 3. Extracted Implementation Checklist
- [x] Leaflet integrated with dynamic Next.js import (`ssr: false`)
- [x] Correct OpenStreetMap attribution displayed
- [x] Browser geolocation with fallback to Dhaka coordinates on denial
- [x] Custom map markers indicating verification status
- [x] Interactive popup on marker click routing to mosque details
- [x] Graceful loading skeletons and error state UI

---

## 4. Implementation Slices & Proof of Completion

### TK-MAP-01: Leaflet Integration & Dynamic SSR Handling
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Integrate Leaflet and OpenStreetMap tiles into the Next.js frontend application with dynamic client-side loading to prevent window/document undefined SSR errors.
- **Acceptance Criteria**:
  - [x] Dynamic wrapper in `MosqueMap.tsx` using `next/dynamic` with `{ ssr: false }`.
  - [x] Tile layer configured with OSM standard tiles and proper attribution.
  - [x] Custom Leaflet divIcon markers color-coded for verified vs unverified mosques.
  - [x] Marker click handler triggers mosque selection and detail preview.
- **Implementation Files**:
  - Frontend Component: `frontend/src/components/MosqueMap.tsx`
  - Layout/Styles: `frontend/src/app/globals.css`

### TK-MAP-02: Geolocation & Responsive Viewport Controller
- **Status**: `[x] Completed` | **Priority**: Medium
- **Description**: Provide user GPS location acquisition on map load with seamless fallback handling, accompanied by mobile-responsive layout toggle between map view and list view.
- **Acceptance Criteria**:
  - [x] Checks `navigator.geolocation` on mount with reasonable timeout.
  - [x] If permission denied or unavailable, smoothly centers on default Dhaka coordinates without throwing errors.
  - [x] Floating "Locate Me" button re-triggers browser geolocation.
  - [x] Responsive layout in `app/page.tsx` switches between map, split-view, or list-view on smaller screens.
- **Implementation Files**:
  - Frontend Home View: `frontend/src/app/page.tsx`
  - Map Component: `frontend/src/components/MosqueMap.tsx`
