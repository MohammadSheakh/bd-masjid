# TK-MAP-01: Leaflet Integration & Dynamic SSR Handling

## Spec
Parent Spec: [map-discovery-ui.md](../map-discovery-ui.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Integrate Leaflet and OpenStreetMap tiles into the Next.js frontend application with dynamic client-side loading to prevent window/document undefined SSR errors.

## Acceptance Criteria
- [x] Dynamic wrapper in `MosqueMap.tsx` using `next/dynamic` with `{ ssr: false }`.
- [x] Tile layer configured with OSM standard tiles and proper attribution.
- [x] Custom Leaflet divIcon markers color-coded for verified vs unverified mosques.
- [x] Marker click handler triggers mosque selection and detail preview.

## Implementation Files
- Frontend Component: `frontend/src/components/MosqueMap.tsx`
- Layout/Styles: `frontend/src/app/globals.css`
