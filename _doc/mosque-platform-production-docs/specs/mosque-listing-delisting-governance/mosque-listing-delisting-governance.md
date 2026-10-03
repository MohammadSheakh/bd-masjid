---
id: F-033
name: Mosque Listing Governance & Moderated Delisting (Elimination of Verification Model)
phase: 3
status: completed

depends_on:
  - F-001
  - F-003
  - F-004
  - F-006
  - F-032

blocks: []

parallel_with: []

source:
  - 01-PRD-PRODUCTION.md#product-principles
  - 01-PRD-PRODUCTION.md#mosque-status
  - 02-SYSTEM-ARCHITECTURE.md#sovereign-mosque-registry
  - 03-DATA-API-CONTRACTS.md#mosques
  - 06-IMPLEMENTATION-CHECKLIST.md#f-mosque-creation-vertical-slice
---

# Feature Specification: Mosque Listing Governance & Moderated Delisting

## 1. Overview
This specification eliminates the legacy concept of "Verified / Unverified / Rejected" mosques across the platform and replaces it with an open community listing model governed by crowdsourced issue reports and administrative delisting:
1. **Immediate Community Listing**: Any mosque created by a user is immediately active and listed (`isListed: true`) without requiring a pending verification bottleneck.
2. **Elimination of Verification Visuals**: Confusing "Unverified" / "Verified" status chips are removed from the frontend (Navbar branding, mosque cards, map popups, and detail modals).
3. **Crowdsourced Reporting**: Congregants and community visitors can flag any mosque with inaccuracies (incorrect timetable, false location, closed permanently, duplicate, spam/fake) through the Issue Report modal.
4. **Administrative Delisting & Map Exclusion**: Platform administrators review reported mosques and can make them **Unlisted** (`isListed: false`). Unlisted mosques are **strictly excluded from the public map, nearby spatial radial search (`ST_DWithin`), and public search queries**.
5. **Information Correction & Relisting**: Administrators can inspect unlisted mosques in the Enterprise Admin Console, update or correct their details, and restore them to **Listed** (`isListed: true`).

---

## 2. Business Invariants
1. **Default Listing Invariant**:
   - Every valid mosque creation request defaults to `isListed: true`.
2. **Public Map & Search Exclusion Invariant**:
   - Any query executed via `GET /api/v1/mosques/nearby` or public `GET /api/v1/mosques/search` MUST enforce `isListed = true` and `isDeleted = false`. Unlisted mosques must never appear as map pins or in search suggestions for normal users.
3. **Administrative Delisting Authority**:
   - Only authenticated actors with platform `admin` or `moderator` roles can toggle a mosque's listing status (`isListed: false` to delist, `isListed: true` to relist).
4. **Mandatory Audit Logging**:
   - Every delist (`MOSQUE_UNLISTED`) and relist (`MOSQUE_LISTED`) operation must write an immutable audit log record capturing the actor, previous state, new state, reason, and timestamp.
5. **Direct Link Protection**:
   - Public requests to `GET /api/v1/mosques/:id` for an unlisted mosque by unauthenticated or non-admin users must return `404 Not Found` (or an explicit unlisted notice), preventing unauthorized public access to delisted entities.

---

## 3. Data Model Reference

### Prisma Schema Entities:
```prisma
model Mosque {
  // ... core attributes
  isListed       Boolean   @default(true)
  unlistedReason String?
  unlistedAt     DateTime?
  unlistedById   String?
  unlister       User?     @relation("MosqueUnlister", fields: [unlistedById], references: [id], onDelete: SetNull)

  isDeleted      Boolean   @default(false)
  deletedAt      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([isListed, isDeleted])
}
```

---

## 4. REST API Contracts

### Mosque Operations
- `PATCH /api/v1/mosques/:id/listing`
  - Roles: `admin`, `moderator`
  - Body: `{ isListed: boolean, reason?: string }`
  - Response: `{ success: true, data: Mosque }`
  - Writes `MOSQUE_UNLISTED` or `MOSQUE_LISTED` audit record.

- `PATCH /api/v1/mosques/:id`
  - Supports updating `isListed` and `unlistedReason` alongside metadata.

- `GET /api/v1/mosques?page=1&limit=25&isListed=true|false`
  - Admin endpoint: Allows filtering directory by listing state.

- `GET /api/v1/mosques/nearby?lat=...&lng=...&radius=...`
  - Public endpoint: Excludes unlisted mosques (`m."isListed" = true`).

---

## 5. Implementation Slices & Proof of Completion

### TK-LIST-01: Prisma Schema Migration & Domain Model Update
- [x] Add `isListed Boolean @default(true)`, `unlistedReason String?`, `unlistedAt DateTime?`, `unlistedById String?` to `Mosque`.
- [x] Add `unlistedMosques Mosque[] @relation("MosqueUnlister")` to `User`.
- [x] Apply migration `20261003180000_mosque_listing_governance_and_delisting`.
- **Files**:
  - `backend-nest-prisma/prisma/schema/mosque.module/mosque.prisma`
  - `backend-nest-prisma/prisma/schema/user/user.prisma`
  - `backend-nest-prisma/prisma/schema.prisma`

### TK-LIST-02: Backend Listing Enforcement & Delist/Relist API
- [x] Enforce `isListed = true` on `mosques.create`.
- [x] Enforce `m."isListed" = true` in `findNearby` PostGIS radial query.
- [x] Enforce `isListed = true` in public `search` query.
- [x] Implement `updateListingStatus` service method with `MOSQUE_UNLISTED` / `MOSQUE_LISTED` audit logging.
- [x] Add `PATCH /api/v1/mosques/:id/listing` endpoint with RBAC (`admin`, `moderator`).
- [x] Update controller and service unit tests.
- **Files**:
  - `backend-nest-prisma/src/features/mosques/mosques.service.ts`
  - `backend-nest-prisma/src/features/mosques/mosques.controller.ts`
  - `backend-nest-prisma/src/features/mosques/dto/update-mosque.dto.ts`
  - `backend-nest-prisma/src/features/mosques/dto/mosque-query.dto.ts`
  - `backend-nest-prisma/src/features/mosques/test/mosques.service.spec.ts`
  - `backend-nest-prisma/src/features/mosques/test/mosques.controller.spec.ts`

### TK-LIST-03: Ferio Frontend UI Overhaul (Eliminating Verification & Adding Listing Governance)
- [x] Remove `Verified` badge next to `BD Masjid` in Navbar branding (`Navbar.tsx`).
- [x] Remove `Verified / Unverified` badge in `MosqueDetailModal.tsx`.
- [x] Remove `Verified / Unverified` badge in `MosqueCard.tsx`.
- [x] Remove `Verified / Unverified` badge in `/mosques/[id]/page.tsx`.
- [x] In `admin/page.tsx`: Remove "Pending Queue" tab; replace verification filter with "Listing Status: All / Listed / Unlisted"; update Status column to show Listed/Unlisted with icon; add 1-click Delist/Relist action.
- [x] In `AdminMosqueInspectionModal.tsx`: Replace verification status with Listed/Unlisted toggle and capture delisting reason.
- **Files**:
  - `frontend/src/types/mosque.ts`
  - `frontend/src/lib/api.ts`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/MosqueCard.tsx`
  - `frontend/src/components/MosqueDetailModal.tsx`
  - `frontend/src/app/mosques/[id]/page.tsx`
  - `frontend/src/app/admin/page.tsx`
  - `frontend/src/components/AdminMosqueInspectionModal.tsx`
