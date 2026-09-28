# TK-SRCH-03: Frontend Search Bar & Realtime Filtering

## Spec
Parent Spec: [nearby-search.md](../nearby-search.md)

## Status
**Completed** `[x]`

## Priority
Medium

---

## Description
Integrate the search input into the frontend Navbar and home page, supporting real-time debounced filtering, radius adjustment, and synchronized map viewport updates.

## Acceptance Criteria
- [x] Search bar in `Navbar.tsx` and main hero in `app/page.tsx`.
- [x] Debounced user input to prevent excessive API requests.
- [x] Filtering options for verified-only, facilities (wudu, AC, women's prayer area).
- [x] Synchronizes with `MosqueMap.tsx` and list view `MosqueCard.tsx`.

## Implementation Files
- Frontend Component: `frontend/src/components/Navbar.tsx`
- Home View: `frontend/src/app/page.tsx`
- Card Component: `frontend/src/components/MosqueCard.tsx`
