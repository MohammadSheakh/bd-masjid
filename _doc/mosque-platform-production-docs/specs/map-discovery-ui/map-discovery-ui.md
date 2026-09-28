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

## 4. Associated Tickets
- [TK-MAP-01: Leaflet Integration & Dynamic SSR Handling](tickets/TK-MAP-01-leaflet-dynamic-integration.md)
- [TK-MAP-02: Geolocation & Responsive Viewport Controller](tickets/TK-MAP-02-geolocation-and-viewport.md)
