---
id: F-035
name: Followed Mosques First Feed with Dynamic Discovery Search
phase: 3
status: completed

depends_on:
  - F-001
  - F-004
  - F-031
  - F-034

blocks: []

parallel_with: []

source:
  - 01-PRD-PRODUCTION.md#community-and-staff
  - 02-SYSTEM-ARCHITECTURE.md#sovereign-mosque-registry
  - 03-DATA-API-CONTRACTS.md#community-bookmarks
  - 08-PRODUCTION-ENGINEERING-STANDARD.md#definition-of-done
---

# Feature Specification: Followed Mosques First Feed with Dynamic Discovery Search

## 1. Overview
This specification prioritizes personalized utility for worshippers across Bangladesh by displaying followed mosques by default, while dynamically revealing discovery/search results whenever the user searches or applies filters.
1. **Followed-First Personalization**: The default homepage mosque feed displays only the mosques the user follows, giving them immediate access to their preferred Jamaat timings and announcements.
2. **Anonymous & Authenticated Parity**: Authenticated accounts hydrate follows from `GET /api/v1/users/me/bookmarks`, while anonymous visitors hydrate follows from local client storage (`localStorage['bd_masjid_bookmarks']`) via parallel batch hydration.
3. **Seamless Dynamic Search Fallback**: Entering a search term, selecting a non-default city (`Dhaka`, `Chattogram`, `Sylhet`), or toggling facility criteria instantly switches the feed into discovery mode.
4. **Visual & Structural Preservation**: The search input, city filter pills, facility tags, and card aesthetics remain visually identical in compliance with Ferio design standards.
5. **Comprehensive Map Viewport & Pin Hierarchy**: In the map area, all listed mosques remain visible. Followed mosques are rendered with regular-sized pins (34px), while non-followed mosques display compact smaller-sized pins (22px).

---

## 2. Business Invariants
1. **Feed Personalization Invariant**:
   - When `searchQuery` is empty, `selectedCity === 'All'`, and no facility filter is enabled, the feed MUST display only followed mosques.
2. **Search Discovery Invariant**:
   - When active search or filter criteria are present, the feed MUST display all matching mosques (both followed and unfollowed) with distance and verification badges.
3. **Empty State Guidance**:
   - If a user has zero followed mosques in default mode, an informative Ferio empty state guides them to search or explore.
4. **Zero Layout Distortion**:
   - Existing search box, city options (`All`, `Dhaka`, `Chattogram`, `Sylhet`), and facilities options (`Women's Area`, `AC`, `Wheelchair`, `Parking`) MUST remain intact in structure, styling, and behavior.
5. **Map Coverage & Pin Hierarchy Invariant**:
   - The map MUST render all listed mosques in the spatial area/search results.
   - Followed mosques MUST render regular size (34px, zIndex 50).
   - Non-followed mosques MUST render smaller size (22px, zIndex 10).

---

## 3. Implementation Checklist
- [x] Author ADR-022, ADR-023, and Feature Specification F-035
- [x] Frontend: Implement `fetchFollowedMosques()` in `frontend/src/lib/api.ts`
- [x] Frontend: Update `frontend/src/app/page.tsx` default feed to render followed mosques
- [x] Frontend: Maintain instant search and filter fallback behavior
- [x] Frontend: Feed all listed mosques to `MosqueMap` while retaining followed list in sidebar
- [x] Frontend: Implement regular vs smaller marker styling based on followed status in `MosqueMap`
- [x] Verify TypeScript compilation and production build
