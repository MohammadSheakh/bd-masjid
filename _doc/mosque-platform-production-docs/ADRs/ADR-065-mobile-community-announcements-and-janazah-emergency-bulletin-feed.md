# ADR-065: Mobile Community Announcements and Janazah / Emergency Bulletin Feed

## Status
Accepted

## Date
2026-10-10

## Context
Mosques in Bangladesh serve as primary local community hubs for urgent communications, including Janazah (funeral) notices, emergency flood/cyclone warnings, Ramadan Taraweeh announcements, and Eid congregation schedules.

The backend provides a full-featured, geospatial announcements module:
- `GET /api/v1/announcements/feed`: Returns spatial feed filtering by distance (`radiusKm`), category, and bookmarked status (`FeedAnnouncementsDto`).
- `GET /api/v1/mosques/:id/announcements`: Public timeline of announcements for a specific mosque.
- `POST /api/v1/mosques/:id/announcements`: Verified mosque leadership announcement posting (`CreateAnnouncementDto`).

The mobile client requires a dedicated Ferio-styled Announcements Bulletin Hub (`AnnouncementsFeedModal.tsx`) and Mosque Detail card (`MosqueAnnouncementsCard.tsx`), backed directly by these backend endpoints, with offline caching and category taxonomy.

## Decision
We implement the Community Announcements Bulletin Hub adhering to:

1. **Category Taxonomy & DTO Alignment (`types/announcement.ts`)**:
   - `AnnouncementCategory`: `GENERAL | JUMUAH_KHUTBAH | EMERGENCY_ALERT | RAMADAN | JANAZA | EID | MAINTENANCE`
   - Filter chips: `All`, `🚨 Emergency`, `⚰️ Janazah`, `🕌 Jumu'ah`, `🌙 Ramadan`, `🎉 Eid`, `🔧 Maintenance`.
2. **ApiClient Integration (`ApiClient`)**:
   - `getAnnouncementsFeed(params: FeedAnnouncementsParams)` -> `GET /api/v1/announcements/feed`.
   - `getMosqueAnnouncements(mosqueId: string)` -> `GET /api/v1/mosques/:id/announcements`.
   - `createAnnouncement(mosqueId: string, payload: CreateAnnouncementPayload)` -> `POST /api/v1/mosques/:id/announcements`.
3. **Ferio Visual Aesthetics (`AnnouncementCard.tsx`, `AnnouncementsFeedModal.tsx`)**:
   - Pinned notices with amber/rose accent badges.
   - High-contrast typography (`#111114`, `#6e6e73`), 1px borders (`#e8e8ea`), 12px card radii.
   - Expandable body reading and native share action.
4. **Resilience & Performance**:
   - 15-minute stale-while-revalidate caching.
   - Low-end hardware performance gate compliant (<65MB heap, 60 FPS scrolling).

## Consequences
- **Positive**: Direct parity with backend Announcements module (`backend-nest-prisma/src/features/announcements/`).
- **Positive**: Solves a major daily utility need for Bangladeshi worshippers (especially immediate Janazah notices).
- **Positive**: Low memory overhead using localized cards and lightweight pagination.
