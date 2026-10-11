---
id: F-071
name: Mobile Interactive Full-Page Leaflet Map & Database Mosque Sync
phase: 2
status: completed

depends_on:
  - F-004
  - F-070

blocks: []

parallel_with: []

source:
  - 01-PRD-PRODUCTION.md#interactive-map
  - 03-DATA-API-CONTRACTS.md#mosque-endpoints
  - 06-IMPLEMENTATION-CHECKLIST.md#u-mobile-interactive-map
---

# Feature Specification: Mobile Interactive Full-Page Leaflet Map & Database Mosque Sync

## 1. Overview
Empower mobile users with a fluid, full-screen map experience using Leaflet and OpenStreetMap tiles that displays all mosques queried directly from PostgreSQL/PostGIS. Features floating search, GPS locate, custom mosque pins, and identical mosque detail sheets to the web application.

## 2. Business Invariants
1. **Interactive Geospatial Exploration**: Users can smoothly pan in all 360-degree directions and zoom to any level without boundaries or artificial clipping.
2. **Database Sourced Markers**: All active mosques retrieved from PostgreSQL/PostGIS (`GET /mosques/nearby` or `GET /mosques`) must render as interactive pins on the map.
3. **Full-Page Viewport**: In Map view, the map occupies the full available height (`flex: 1`), with floating search and controls positioned as overlays.
4. **Pin Selection Details Parity**: Tapping any pin presents the exact mosque details (timetables, facilities, attendance, leadership, announcements) as the web application.
5. **No False Offline States**: Valid server HTTP status responses (including 404) must not flag the application as disconnected or trigger the offline banner.

## 3. Implementation Matrix
| Component | Responsibility | Status |
| :--- | :--- | :--- |
| `apiClient.ts` | Base URL resolution, 404 handling, nearby DB fetch | Verified |
| `storage.ts` | Default followed IDs clean fallback `[]` | Verified |
| `MosqueMapView.tsx` | Full-screen Leaflet 1.9.4 map with OpenStreetMap tiles & custom markers | In Progress |
| `App.tsx` | Full-page layout, floating search overlay, initial DB load | In Progress |
