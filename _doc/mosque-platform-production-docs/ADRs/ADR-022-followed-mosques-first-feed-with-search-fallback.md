# ADR-022: Followed Mosques First Feed with Dynamic Discovery and Search Fallback

## Status
Accepted

## Date
2026-10-03

## Context
Worshippers and regular community members access the platform primarily to view today's congregational Jamaat times for the mosques they actively attend (their neighborhood mosque, workplace mosque, or regular Friday prayer venue).

Previously, the homepage feed defaulted to a generic GPS-proximity list (e.g. 10 nearest mosques within 10km), irrespective of whether the visitor had already followed specific mosques. Users had to repeatedly scroll past unvisited mosques or manually hunt down the "Following" facility pill to view their personalized schedule.

Conversely, when a user wants to find a new mosque, research another district, or explore facilities, they rely on the search bar, city quick-filters (All, Dhaka, Chattogram, Sylhet), and facility tags (Women's Area, AC, Wheelchair, Parking).

## Decision
We establish a **Followed-First Personalization Model** for the primary mosque feed:

1. **Default View: Followed Mosques Only**:
   - When no search query or facility/city filter is active (`searchQuery === ''`, `selectedCity === 'All'`, no facility filters checked), the list exclusively displays the user's followed/bookmarked mosques.
   - Works seamlessly across authenticated accounts (`GET /api/v1/users/me/bookmarks`) and anonymous visitors (`localStorage` bookmark store `bd_masjid_bookmarks` hydrated via `fetchMosqueById`).

2. **Empty State Governance**:
   - If a visitor has not followed any mosques yet, the feed renders an inviting Ferio empty state explaining that following mosques pins their daily prayer schedule to the homepage, with an immediate call to search or explore.

3. **Dynamic Discovery and Search Mode**:
   - As soon as a user enters a search term, selects a specific city pill, or toggles any facility filter, the feed seamlessly transitions to **Discovery & Search Mode**, rendering matching search results with distance, verified timetable badges, and follow/bookmark toggle actions.
   - Clearing the search input or resetting filters immediately restores the personalized followed mosques feed.

4. **UI Design Invariants Preserved**:
   - The search input, city pills (`All`, `Dhaka`, `Chattogram`, `Sylhet`), facility filters (`Women's Area`, `AC`, `Wheelchair`, `Parking`), and card layout remain completely unchanged in visual appearance and styling per Ferio design standards.

## Consequences

### Positive
- **Instant Operational Value**: Musallis opening the app immediately see prayer times for their home or neighborhood mosques without extra taps.
- **Zero Confusion**: Clear distinction between the personalized followed dashboard and active search results.
- **Full Privacy & Offline Resilience**: Anonymous users receive full personalization via local client storage hydration without requiring immediate account creation.

### Negative / Trade-offs
- First-time visitors with zero follows see an empty state prompting search instead of random nearby mosques. This is mitigated by clear onboarding copy and quick search actions.
