---
id: F-035
name: Followed Mosques First Feed with Dynamic Discovery Search
phase: 3
status: in-progress

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

---

## 3. Implementation Checklist
- [x] Author ADR-022 and Feature Specification F-035
- [ ] Frontend: Implement `fetchFollowedMosques()` in `frontend/src/lib/api.ts`
- [ ] Frontend: Update `frontend/src/app/page.tsx` default feed to render followed mosques
- [ ] Frontend: Maintain instant search and filter fallback behavior
- [ ] Verify TypeScript compilation and production build
