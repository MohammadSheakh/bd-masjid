# TK-MAP-02: Geolocation & Responsive Viewport Controller

## Spec
Parent Spec: [map-discovery-ui.md](../map-discovery-ui.md)

## Status
**Completed** `[x]`

## Priority
Medium

---

## Description
Provide user GPS location acquisition on map load with seamless fallback handling, accompanied by mobile-responsive layout toggle between map view and list view.

## Acceptance Criteria
- [x] Checks `navigator.geolocation` on mount with reasonable timeout.
- [x] If permission denied or unavailable, smoothly centers on default Dhaka coordinates without throwing errors.
- [x] Floating "Locate Me" button re-triggers browser geolocation.
- [x] Responsive layout in `app/page.tsx` switches between map, split-view, or list-view on smaller screens.

## Implementation Files
- Frontend Home View: `frontend/src/app/page.tsx`
- Map Component: `frontend/src/components/MosqueMap.tsx`
