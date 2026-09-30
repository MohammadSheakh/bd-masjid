# ADR-011: Official Mosque Announcements Channel & Broadcast Governance

## Status
**Accepted**

## Date
2026-09-30

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In Bangladeshi communities, the local mosque is not merely a place of prayer; it is the central civic bulletin board for congregational announcements, Jumu'ah khutbah topics, emergency advisories (severe weather, lost children, medical blood appeals), Janaza (funeral prayer) schedules, Ramadan Taraweeh/Iftar arrangements, and Eid logistics.

Historically, these notices have been broadcast through low-reach analog means: paper flyers taped to mosque walls, microphone loudspeakers that cannot be heard by travelers or remote musallis, or unstructured social media groups susceptible to misinformation.

In Release 1 (`F-012: Community Engagement`), the platform deployed an initial prototype `MosqueAnnouncement` table with basic string fields (`title`, `content`, `isPinned`). However, operational feedback and the transition into Release 2 (`F-020: Mosque Staff Delegation`) reveal key architectural gaps:
1. **Lack of Category Taxonomy**: Announcements lacked structural classification, making it impossible for worshippers to filter for Jumu'ah khutbah topics, Janaza notices, or urgent emergency alerts.
2. **Missing Lifecycle & Expiration**: Notices remained active indefinitely unless manually deleted, resulting in stale announcements cluttering public views.
3. **No Granular Mutation Governance**: Only creation and deletion existed; announcements could not be edited, nor were high-consequence alerts (such as `EMERGENCY_ALERT`) guarded against posting by lower-privilege staff.
4. **No Regional or Follower Discovery**: Announcements were strictly siloed within single mosque profile views, with no aggregated community feed across bookmarked or nearby geographic mosques.

---

## Decision

### 1. Dedicated Modular Domain (`announcements.module`)
In alignment with `02-SYSTEM-ARCHITECTURE.md` (Modular Monolith Domain Structure), announcements are extracted from the generic `community` module into a dedicated, cohesive feature domain:
- Backend module: `backend-nest-prisma/src/features/announcements/`
- Modular schema: `backend-nest-prisma/prisma/schema/announcements.module/announcements.prisma`
- Backward Compatibility: The HTTP controllers expose canonical routes under `/api/v1/announcements` while preserving legacy route aliases under `/api/v1/mosques/:id/announcements` and `/api/v1/community/:id/announcements` to ensure zero breaking changes for existing consumers.

### 2. Rich Category Taxonomy & Schema Lifecycle
The `MosqueAnnouncement` model is upgraded with:
- **`category`**: Strongly-typed `AnnouncementCategory` enum:
  - `GENERAL`: Routine mosque notices and community updates.
  - `JUMUAH_KHUTBAH`: Friday sermon theme, guest Khatib speaker, and timings.
  - `EMERGENCY_ALERT`: High-priority safety, natural disaster, or critical community notices.
  - `RAMADAN`: Taraweeh details, Sehri/Iftar schedules, and Itikaf registrations.
  - `EID`: Eid-ul-Fitr and Eid-ul-Adha Jamaat schedules and staging grounds.
  - `JANAZA`: Funeral prayer timings, deceased details, and burial locations.
  - `MAINTENANCE`: Renovations, wudu area repairs, or temporary facility closures.
- **`expiresAt`**: Nullable `DateTime` timestamp defining automatic deprecation.
- **`authorRole`**: Snapshot string (e.g. `IMAM`, `COMMITTEE_PRESIDENT`) recording the verified title of the author at the moment of publication for permanent historical provenance.

### 3. Tiered Role-Governed Authority Matrix
Leveraging the `F-020` staff delegation infrastructure:
- **Authoring Authority**: Any verified local staff member (`MOSQUE_ADMIN`, `COMMITTEE_PRESIDENT`, `COMMITTEE_SECRETARY`, `COMMITTEE_MEMBER`, `IMAM`, `KHATIB`, `MUAZZIN`, `KHADEM`) or global platform `admin`/`moderator` can publish general announcements.
- **Emergency Alert Gating**: `EMERGENCY_ALERT` announcements can ONLY be published by `MOSQUE_ADMIN`, `COMMITTEE_PRESIDENT`, or platform `admin`/`moderator`.
- **Edit & Delete Invariants**:
  - The original author can update or delete their own announcement.
  - A verified `MOSQUE_ADMIN`, `COMMITTEE_PRESIDENT`, or platform admin can update, pin, or delete *any* announcement for that mosque.
- **Pinning Safety**: A mosque may have at most **3 concurrent pinned announcements** to preserve clean viewport hierarchy and prevent screen clutter on mobile devices.

### 4. Zero-Extra-Infrastructure Expiration & Spatial Discovery
- **No Redis / No BullMQ**: Expiration is resolved purely at the database query layer via parameterized SQL/Prisma: `WHERE (expiresAt IS NULL OR expiresAt > NOW())`.
- **Administrative Transparency**: Verified staff and administrators can supply `includeExpired=true` to review historical records.
- **Nearby Community Feed (`GET /api/v1/announcements/feed`)**:
  - Leverages existing PostgreSQL/PostGIS spatial indexes (`ST_DWithin` on `Mosque.location`) for musallis looking for broadcasts within a specified radius (e.g. 5km).
  - Supports bookmark-scoped aggregation for users following specific mosques (`MosqueBookmark`).
  - Composite indexes on `[mosqueId, isPinned, createdAt]` and `[category, expiresAt]` ensure sub-50ms query response times under concurrent load.

### 5. Atomic Audit Trail
All mutations (`CREATE`, `UPDATE`, `DELETE`, `PIN_TOGGLE`) execute inside an atomic PostgreSQL `$transaction` alongside an immutable `AuditLog` entry capturing actor identity, previous state, new state, and mosque ID.

---

## Consequences

### Positive
- **Authoritative Congregational Communications**: Musallis receive verified, categorized notices directly from authentic local leadership.
- **Emergency Responsiveness**: Critical announcements (e.g. Janaza or emergency alerts) are immediately identifiable with distinct Ferio UI styling and elevated feed prioritization.
- **Complete Historical Provenance**: Storing `authorRole` snapshot preserves authentic attribution even if staff roles are later reassigned or revoked.
- **Zero Infrastructure Bloat**: Operates entirely within the existing PostgreSQL/PostGIS deployment with zero message queues, Redis instances, or background cron workers.

### Tradeoffs & Mitigations
- **Lazy Expiration Storage**: Expired announcements remain in the database table rather than being actively purged by a cron job.
  - *Mitigation*: The table size for announcements is negligible (thousands of rows per year across thousands of mosques). B-Tree indexing on `expiresAt` keeps read queries fast, and an optional archival strategy can be introduced in later maintenance phases if needed.
- **Snapshot Role Staleness**: If an author is subsequently revoked, the announcement remains publicly marked with their historical role at the time of publication.
  - *Mitigation*: This aligns with legal and audit invariants. If an announcement must be repudiated, the local `MOSQUE_ADMIN` or platform admin can edit or delete it immediately.
