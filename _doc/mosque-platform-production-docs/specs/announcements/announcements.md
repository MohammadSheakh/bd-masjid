---
id: F-022
name: Official Mosque Announcements Channel
phase: 2
status: completed

depends_on:
  - F-001
  - F-003
  - F-004
  - F-020

blocks: []

parallel_with:
  - F-021

source:
  - 01-PRD-PRODUCTION.md#verified-mosque-community-roles
  - 02-SYSTEM-ARCHITECTURE.md#modular-monolith-domain-structure
  - 03-DATA-API-CONTRACTS.md#community-and-staff
  - 06-IMPLEMENTATION-CHECKLIST.md#d-authorization
  - 07-RELEASE-PLAN.md#release-2--verified-mosque-community-roles
  - ADRs/ADR-011-announcements.md
---

# Feature Specification: Official Mosque Announcements Channel (F-022)

## 1. Overview & Problem Statement

In Bangladesh, mosques serve as the primary community focal point for religious announcements, Friday Jumu'ah khutbah topics, emergency alerts (cyclones, floods, lost children, medical appeals), Janaza (funeral) prayer logistics, and Ramadan/Eid scheduling. Traditionally, these broadcasts are delivered either via loudspeakers with limited geographic range or posted as paper notices on physical announcement boards.

In Release 1 (`F-012: Community Engagement`), an initial `MosqueAnnouncement` table was introduced. However, it lacked:
1. **Categorical Taxonomy**: Musallis could not filter by announcement types (e.g. Jumu'ah topics vs Janaza vs Emergency).
2. **Lifecycle & Expiration**: Notices remained permanently visible unless deleted by hand, leading to stale information.
3. **Role-Governed Publishing & Mutation**: No capability existed to edit notices, and high-impact emergency broadcasts lacked targeted permission gating.
4. **Community Discovery**: No aggregated feed existed for musallis following multiple mosques or looking for urgent notices in their geographic area.

**F-022** establishes a robust **Official Mosque Announcements Channel**:
- Extracts announcements into an autonomous, modular domain (`src/features/announcements/`).
- Introduces a strongly typed category taxonomy (`GENERAL`, `JUMUAH_KHUTBAH`, `EMERGENCY_ALERT`, `RAMADAN`, `JANAZA`, `EID`, `MAINTENANCE`).
- Implements role-governed mutation rights backed by `F-020` staff verification (restricting `EMERGENCY_ALERT` to mosque executive leadership).
- Enforces an automated, zero-extra-infrastructure expiration model in PostgreSQL.
- Provides dual discovery feeds: a single-mosque timeline and a geospatial/bookmark community feed (`/api/v1/announcements/feed`).
- Delivers a polished Ferio design UI featuring distinct category badges, high-visibility emergency banners, and an author attribution pill.

---

## 2. Business Invariants & State Machine

### 2.1 Authoring & Mutation Permission Matrix

| Role | Standard Categories (`GENERAL`, `JUMUAH`, `RAMADAN`, `JANAZA`, `EID`, `MAINTENANCE`) | Emergency Category (`EMERGENCY_ALERT`) | Update Own Announcement | Update/Delete Any Announcement for Mosque | Pin / Unpin Announcement |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Global Admin / Moderator** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **MOSQUE_ADMIN / COMMITTEE_PRESIDENT** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full (Up to 3) |
| **COMMITTEE_SECRETARY / COMMITTEE_MEMBER** | ✅ Full | ❌ Forbidden (403) | ✅ Full | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **IMAM / KHATIB / MUAZZIN / KHADEM** | ✅ Full | ❌ Forbidden (403) | ✅ Full | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **Unverified / General Musalli** | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) |

### 2.2 Core Invariants

1. **Role-Governed Authority**:
   - Only verified staff of that specific mosque (`isVerified: true` in `MosqueStaff`) or global platform admins (`admin`, `moderator`) can author announcements.
   - `EMERGENCY_ALERT` announcements require executive local authority (`MOSQUE_ADMIN`, `COMMITTEE_PRESIDENT`) or global platform administration.
2. **Author Attribution & Snapshot Provenance**:
   - Every announcement records the author's `userId` and captures their verified role title snapshot at the time of publication in `authorRole` (e.g. `"IMAM"`, `"KHATIB"`, `"MOSQUE_ADMIN"`).
   - If an author leaves or has their staff status revoked, their past announcements remain permanently visible with their historical role snapshot intact.
3. **Pinning Ceiling**:
   - A single mosque may have at most **3 active pinned announcements** simultaneously. Attempting to pin a 4th announcement returns `400 Bad Request` unless an existing pinned announcement is unpinned first.
4. **Zero-Extra-Infra Expiration**:
   - The platform MUST NOT introduce Redis TTL keys or BullMQ cron queues for expiration.
   - Expiration is determined in PostgreSQL queries: `WHERE (expiresAt IS NULL OR expiresAt > NOW())`.
   - General public queries exclude expired announcements by default. Verified staff may inspect expired records by passing `includeExpired=true`.
5. **Atomic Audit Logging**:
   - Every creation, modification, deletion, and pin status toggle MUST write an immutable `AuditLog` entry in the same PostgreSQL transaction (`$transaction`).
6. **Backward Compatibility**:
   - Existing endpoints `/api/v1/mosques/:id/announcements` and `/api/v1/community/:id/announcements` must remain functional and routed through the new `AnnouncementsModule`.

---

## 3. Data Model Reference

### 3.1 Prisma Schema (`backend-nest-prisma/prisma/schema/announcements.module/announcements.prisma`)

```prisma
enum AnnouncementCategory {
  GENERAL
  JUMUAH_KHUTBAH
  EMERGENCY_ALERT
  RAMADAN
  JANAZA
  EID
  MAINTENANCE
}

model MosqueAnnouncement {
  id          String                @id @default(cuid())
  mosqueId    String
  mosque      Mosque                @relation(fields: [mosqueId], references: [id], onDelete: Cascade)

  title       String
  content     String
  category    AnnouncementCategory  @default(GENERAL)
  isPinned    Boolean               @default(false)

  // Scheduling and Expiration
  expiresAt   DateTime?

  // Author and Historical Provenance
  authorId    String
  author      User                  @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorRole  String?               // Snapshot of role at time of posting: "IMAM", "MOSQUE_ADMIN", etc.

  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt

  @@index([mosqueId, isPinned, createdAt])
  @@index([category, createdAt])
  @@index([expiresAt])
}
```

---

## 4. REST API Contracts

### 4.1 Get Mosque Announcements Feed
- **Method & Route**: `GET /api/v1/mosques/:id/announcements`
- **Aliases**: `GET /api/v1/community/:id/announcements`, `GET /api/v1/announcements/mosque/:id`
- **Access**: Public
- **Query Parameters**:
  - `category` (optional): `AnnouncementCategory` filter (e.g. `JUMUAH_KHUTBAH`, `EMERGENCY_ALERT`).
  - `includeExpired` (optional, boolean, default `false`): Requires staff authentication; returns expired notices if `true`.
  - `limit` (optional, integer, default `20`, max `50`).
  - `offset` (optional, integer, default `0`).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cly101...",
      "mosqueId": "clx801...",
      "title": "Severe Cyclone Warning - Mosque Open as Relief Shelter",
      "content": "Due to Cyclone Remal, our ground floor and prayer halls are open for emergency shelter...",
      "category": "EMERGENCY_ALERT",
      "isPinned": true,
      "expiresAt": "2026-10-02T18:00:00Z",
      "authorId": "usr901...",
      "authorRole": "MOSQUE_ADMIN",
      "author": {
        "id": "usr901...",
        "name": "Haji Mohammad Rahman"
      },
      "createdAt": "2026-09-30T10:00:00Z",
      "updatedAt": "2026-09-30T10:00:00Z"
    }
  ],
  "total": 1
}
```

### 4.2 Create Mosque Announcement
- **Method & Route**: `POST /api/v1/mosques/:id/announcements`
- **Aliases**: `POST /api/v1/announcements/mosque/:id`
- **Access**: Authenticated (Verified Staff or Platform Admin)
- **Request Body (DTO)**:
```json
{
  "title": "Jumu'ah Khutbah: Preparation for Ramadan & Community Unity",
  "content": "Special guest Khatib Mawlana Abdullah will deliver this Friday's sermon...",
  "category": "JUMUAH_KHUTBAH",
  "isPinned": true,
  "expiresAt": "2026-10-03T14:00:00Z"
}
```
- **Validation Rules**:
  - `title`: String, min 3, max 160 characters.
  - `content`: String, min 10, max 4000 characters.
  - `category`: Must be valid `AnnouncementCategory`.
  - `isPinned`: Optional boolean (default `false`).
  - `expiresAt`: Optional ISO 8601 future date string.
- **Error Responses**:
  - `400 Bad Request`: Validation failure or attempting to pin more than 3 active announcements.
  - `401 Unauthorized`: Missing or invalid bearer token.
  - `403 Forbidden`: User is not a verified staff member of this mosque, or non-admin attempting `EMERGENCY_ALERT`.
  - `404 Not Found`: Mosque does not exist.

### 4.3 Update Mosque Announcement
- **Method & Route**: `PATCH /api/v1/announcements/:announcementId`
- **Aliases**: `PATCH /api/v1/mosques/:mosqueId/announcements/:announcementId`
- **Access**: Authenticated (Author, Mosque Admin, or Platform Admin)
- **Request Body (DTO)**:
```json
{
  "title": "Updated: Jumu'ah Khutbah Timing Adjustment",
  "content": "First Azan will be at 12:45 PM and Khutbah begins promptly at 1:15 PM.",
  "category": "JUMUAH_KHUTBAH",
  "isPinned": false,
  "expiresAt": "2026-10-03T15:00:00Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation error or exceeding pin ceiling.
  - `403 Forbidden`: User is not the author and not a `MOSQUE_ADMIN`/`COMMITTEE_PRESIDENT`/platform admin.
  - `404 Not Found`: Announcement does not exist.

### 4.4 Delete Mosque Announcement
- **Method & Route**: `DELETE /api/v1/announcements/:announcementId`
- **Aliases**: `DELETE /api/v1/mosques/:mosqueId/announcements/:announcementId`
- **Access**: Authenticated (Author, Mosque Admin, or Platform Admin)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "deleted": true,
  "announcementId": "cly101..."
}
```

### 4.5 Aggregated Community & Nearby Announcements Feed
- **Method & Route**: `GET /api/v1/announcements/feed`
- **Access**: Public (Optional Authenticated for bookmarked mosques)
- **Query Parameters**:
  - `lat` (optional, float) & `lng` (optional, float): PostGIS coordinates.
  - `radiusKm` (optional, float, default `5.0`, max `25.0`).
  - `bookmarkedOnly` (optional, boolean, default `false`, requires Auth).
  - `category` (optional): `AnnouncementCategory` filter.
  - `emergencyOnly` (optional, boolean, default `false`): Filter for urgent emergency alerts.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cly101...",
      "mosqueId": "clx801...",
      "mosqueName": "Baitul Mukarram National Mosque",
      "distanceMeters": 420.5,
      "title": "Severe Weather Advisory",
      "content": "...",
      "category": "EMERGENCY_ALERT",
      "isPinned": true,
      "authorRole": "MOSQUE_ADMIN",
      "createdAt": "2026-09-30T10:00:00Z"
    }
  ]
}
```

---

## 5. Security & Audit Logging

### 5.1 RBAC Enforcement
- Guard: `@UseGuards(JwtAuthGuard)` on mutation endpoints.
- Role Check:
  - Global `admin` and `moderator` have override permissions across all mosques.
  - Local authority resolved via `MosqueStaff`: user must have an active record with `isVerified: true` for the target `mosqueId`.
  - Category check: If `category === AnnouncementCategory.EMERGENCY_ALERT`, user role must be `MOSQUE_ADMIN`, `COMMITTEE_PRESIDENT`, or global `admin`/`moderator`.

### 5.2 Audit Logging Invariants
Every mutation writes an `AuditLog` row in the same transaction:
- **`MOSQUE_ANNOUNCEMENT_CREATED`**: Captures `entityType: 'MosqueAnnouncement'`, `entityId`, `actor`, `newValue`, `metadata: { mosqueId, category, isPinned }`.
- **`MOSQUE_ANNOUNCEMENT_UPDATED`**: Captures previous and updated fields.
- **`MOSQUE_ANNOUNCEMENT_DELETED`**: Captures previous record and reason.
- **`MOSQUE_ANNOUNCEMENT_PINNED` / `MOSQUE_ANNOUNCEMENT_UNPINNED`**: Captures pin state change.

---

## 6. Actionable Implementation Checklist

### Backend Engineering (`backend-nest-prisma/`)
- [x] Create `prisma/schema/announcements.module/announcements.prisma` with `AnnouncementCategory` enum and expanded fields (`category`, `expiresAt`, `authorRole`).
- [x] Remove legacy `MosqueAnnouncement` from `community.prisma` and execute clean Prisma migration (`announcements_channel_release2`).
- [x] Create `AnnouncementsModule`, `AnnouncementsService`, and `AnnouncementsController` in `src/features/announcements/`.
- [x] Implement DTOs: `CreateAnnouncementDto`, `UpdateAnnouncementDto`, `GetAnnouncementsQueryDto`, `AnnouncementsFeedQueryDto` with `class-validator`.
- [x] Enforce RBAC permissions: verify staff active status, restrict `EMERGENCY_ALERT`, authorize owner/admin mutations.
- [x] Enforce max 3 pinned announcements business invariant.
- [x] Implement zero-extra-infra PostgreSQL queries for lazy expiration and PostGIS nearby spatial feed.
- [x] Add route aliases ensuring backward compatibility for `/mosques/:id/announcements` and `/community/:id/announcements`.
- [x] Implement unit tests in `announcements.service.spec.ts` covering happy paths, unauthorized attempts, emergency restriction, pin limits, and lazy expiration.

### Frontend Engineering (`frontend/`)
- [x] Update TypeScript definitions in `frontend/src/types/mosque.ts` with `AnnouncementCategory` and new fields.
- [x] Update API client in `frontend/src/lib/api.ts` with typed methods (`fetchMosqueAnnouncements`, `createMosqueAnnouncement`, `updateMosqueAnnouncement`, `deleteMosqueAnnouncement`, `fetchAnnouncementsFeed`).
- [x] Build `MosqueAnnouncementsCard` on `/mosques/[id]` adhering to Ferio visual tokens:
  - High-visibility red emergency banner for active `EMERGENCY_ALERT`.
  - Distinct color-coded pills for categories (`JUMUAH_KHUTBAH`, `JANAZA`, `MAINTENANCE`, `RAMADAN`, `EID`, `GENERAL`).
  - Author attribution badge ("Posted by Imam", "Posted by Mosque Admin").
  - Filter tabs by category.
- [x] Upgrade `AnnouncementModal` for verified staff to support category selection, expiration date picker, and edit capabilities.
- [x] Add unit/build verification ensuring zero TypeScript or Next.js build errors.

---

## 7. Implementation Slices & Proof Matrix

### TK-ANN-01: Announcements Backend Domain, Schema, RBAC & Geospatial Feed
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Modularize announcement schema, add migration, implement `AnnouncementsModule`, enforce role-governed mutation & pin constraints, and build the PostGIS discovery feed.
- **Acceptance Criteria**:
  - [x] Migration applies cleanly and updates `MosqueAnnouncement` table with `category`, `expiresAt`, and `authorRole`.
  - [x] `POST /api/v1/mosques/:id/announcements` forbids unverified users and restricts `EMERGENCY_ALERT` to admins/presidents.
  - [x] Maximum 3 pinned announcements constraint enforced.
  - [x] Expired announcements automatically excluded from public reads.
  - [x] PostGIS spatial feed query returns nearby announcements within sub-50ms latency.
  - [x] Full automated test suite passes (`pnpm test`).
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema/announcements.module/announcements.prisma`
  - Migration: `backend-nest-prisma/prisma/migrations/20260930160000_announcements_channel_release2/migration.sql`
  - DTOs: `backend-nest-prisma/src/features/announcements/dto/`
  - Service: `backend-nest-prisma/src/features/announcements/announcements.service.ts`
  - Controller: `backend-nest-prisma/src/features/announcements/announcements.controller.ts`
  - Module: `backend-nest-prisma/src/features/announcements/announcements.module.ts`
  - Tests: `backend-nest-prisma/src/features/announcements/announcements.service.spec.ts`

### TK-ANN-02: Ferio Frontend Announcements Feed, Emergency Banner & Staff Modal
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Build rich, accessible announcements card on the mosque profile with category tabs, emergency alert styling, verified author badge, and staff management interface.
- **Acceptance Criteria**:
  - [x] Mosque page displays pinned announcements and categorized feed clearly.
  - [x] Emergency alerts display high-visibility alert banner.
  - [x] Verified staff see "Post Notice" / "Manage" controls opening updated modal.
  - [x] Responsive across mobile and desktop viewports with zero layout shift.
  - [x] Production build passes (`pnpm build`).
- **Implementation Files**:
  - Types: `frontend/src/types/mosque.ts`
  - API: `frontend/src/lib/api.ts`
  - Card: `frontend/src/components/MosqueAnnouncementsCard.tsx`
  - Modal: `frontend/src/components/AnnouncementModal.tsx`
  - Profile Page: `frontend/src/app/mosques/[id]/page.tsx`
