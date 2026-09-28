# TK-MOSQ-04: Add Mosque Modal & Pin-Drop UI

## Spec
Parent Spec: [mosques-registry.md](../mosques-registry.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Build the interactive Add Mosque modal on the frontend allowing users to specify mosque name, drag and place a pin on a Leaflet map, view instant duplicate warnings, and submit the new mosque.

## Acceptance Criteria
- [x] Modal component `AddMosqueModal.tsx` accessible via "Add Mosque" button in navigation.
- [x] Embedded interactive Leaflet pin-drop allowing manual coordinate adjustment or map click.
- [x] Debounced call to `/api/v1/mosques/check-duplicate` displaying warning if a mosque exists within 50m.
- [x] Mandatory name input and optional facility checkboxes.
- [x] Submitting updates local map state immediately and provides feedback.
- [ ] Browser E2E automation test for full submission flow (deferred to CI/CD E2E stage per 05-TESTING-STRATEGY §3).

## Implementation Files
- Frontend Component: `frontend/src/components/AddMosqueModal.tsx`
- Parent View: `frontend/src/app/page.tsx`
