# ADR-044: Mobile Mosque Notice Board & Announcements Hub

## Status
Accepted

## Context
Mosques in Bangladesh serve as primary community civic centers for urgent announcements:
1. **Janaazah (Funeral) Prayers**: Highly time-sensitive, often announced only 2–4 hours in advance.
2. **Eid-ul-Fitr / Eid-ul-Adha**: Multiple Jamaat shifts (e.g. 7:00 AM, 8:00 AM, 9:00 AM).
3. **Ramadan Announcements**: Taraweeh timings, Sehri/Iftar arrangements, Itikaf registrations.
4. **Friday Khutbah (Jumu'ah)**: Visiting Khatib names, topics, and prayer timings.

Under ADR-011, the backend exposes structured mosque announcement endpoints (`GET /mosques/:id/announcements`). The mobile client requires an accessible, low-bandwidth, offline-resilient UI matching the Ferio Design System with clear category distinctions, priority banners, and expiration enforcement.

## Decision
1. **Notice Taxonomy & Badging**:
   - Categories: `JANAZAH` (Urgent Crimson `#dc2626`), `EID_PRAYER` (Festive Emerald `#059669`), `RAMADAN` (Amber `#d97706`), `FRIDAY_KHUTBAH` (Slate `#111114`), and `GENERAL_NOTICE`.
   - Notices with `priority: 'URGENT'` display a prominent alert banner at the top of the Mosque Detail Sheet.
2. **Offline-Resilient Announcements Cache**:
   - Announcements for followed mosques are cached in synchronous tiered storage (`PreferencesStorage`).
   - Expired notices (`expiresAt < now`) are filtered out on client render.
3. **Notice Board Modal & Card Component (`NoticeBoardSheet.tsx`)**:
   - Compact notice preview card on `MosqueDetailSheet.tsx` with active notice badge counter (`🔴 2 Notices`).
   - Tapping opens the progressive Notice Board Sheet showing full announcement body, event time, Khatib/organizer contact, and share action.

## Consequences
- **Positive**: Community members receive immediate visibility of critical Janaazah and Eid schedules without needing physical leaflets.
- **Positive**: Strict offline caching ensures users without active cellular data can still see already-fetched announcements.
- **Trade-off**: Requires client-side clock comparison to prune expired announcements when offline.
