# ADR-071: Mobile Interactive Full-Page Leaflet Map & Database Mosque Synchronization

## Status
Accepted

## Context
In the web application (`frontend/`), the map provides a smooth Leaflet OpenStreetMap experience allowing multi-directional inertial panning, smooth zoom controls (`+`/`-`), and visual pins for all mosques queried from PostgreSQL/PostGIS (`GET /api/v1/mosques/nearby`).

In the mobile Expo application:
1. The map was previously rendered as a static canvas bounded to a fixed 440px height with 4 static image tiles and local coordinate projection, preventing full-screen navigation and smooth zooming across the country.
2. The map was restricted to followed mosques instead of loading the comprehensive mosque registry from the backend database.
3. Client 404 responses during startup falsely triggered an "Offline — displaying cached schedules" status banner.

## Decision
1. **Interactive Full-Screen Leaflet View**:
   - In React Native Web and mobile viewports, render an isolated full-page interactive Leaflet 1.9.4 map inside an iframe with OpenStreetMap tile layer (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
   - Support smooth pan in all directions, zoom buttons (`+`/`-`), touch gestures, and mouse-wheel zoom.
   - Embed custom mosque markers matching the web styling (`.custom-mosque-pin`, #111114 badge with `🕌`, highlighted #059669 when active, and followed ring).
   - Communicate selection and pin-drop actions back to React Native via cross-window `postMessage`.
2. **Full-Page Map Layout with Floating Overlays**:
   - When the user switches to Map mode (`viewportMode === 'map'`), the map expands to fill `100%` viewport (`flex: 1`).
   - A floating search bar with quick filters and a floating locate GPS button sit cleanly on top of the map.
3. **Database Mosque Synchronization**:
   - On initial mount, the mobile app calls `ApiClient.getNearbyMosques(23.75, 90.39, 25000)` to populate discovered mosques directly from PostgreSQL/PostGIS.
   - `mapMosques` aggregates all discovered database mosques, searched mosques, and followed mosques.
4. **Resilient Network & Offline Detection**:
   - Normalize API base URL for web runtime (`http://${window.location.hostname}:6733/api/v1`).
   - Treat 404 responses as valid server responses rather than connection drops to prevent false offline banners.
   - Reset default followed mosque IDs fallback to `[]`.
5. **Exact Web Parity for Mosque Details**:
   - Tapping any mosque pin triggers `MosqueDetailSheet` presenting full prayer timetable, facilities, attendance options, announcements, and directions matching the web platform.

## Consequences
- **Positive**: Complete UI and functional parity between web and mobile map views. Full-screen exploration of Bangladesh mosques.
- **Security**: Tile requests obey OpenStreetMap usage policy without leaking client credentials.
