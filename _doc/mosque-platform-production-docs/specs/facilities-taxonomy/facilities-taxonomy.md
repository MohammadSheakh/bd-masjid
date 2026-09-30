---
id: F-021
name: Enhanced Mosque Facilities & Capacity Taxonomy
phase: 2
status: completed

depends_on:
  - F-001
  - F-004

blocks: []

parallel_with:
  - F-020

source:
  - 01-PRD-PRODUCTION.md#6-mosque-profile
  - 01-PRD-PRODUCTION.md#15-search
  - 02-SYSTEM-ARCHITECTURE.md#4-backend-boundary
  - 03-DATA-API-CONTRACTS.md#mosque-schema
  - 06-IMPLEMENTATION-CHECKLIST.md#d-authorization
  - 07-RELEASE-PLAN.md#release-2--verified-mosque-community-roles
  - ADRs/ADR-010-facilities-taxonomy.md
---

# Feature Specification: Enhanced Mosque Facilities & Capacity Taxonomy (F-021)

## 1. Overview & Problem Statement

In Release 1, the platform established authoritative mosque profiles containing basic identification, PostGIS spatial coordinates, and daily prayer/Jamaat timings. However, worshippers and travelers across Bangladesh frequently need to know specific facility and accessibility details before visiting:
1. **Women's Prayer Facilities**: Secluded female prayer space, separate entrance/ablution facilities, and capacity.
2. **Accessibility**: Wheelchair ramps, accessible entrances, and sitting wudu setups for elderly or disabled musallis.
3. **Capacity & Climate Controls**: Total prayer capacity, wudu faucet capacity, and fan or air-conditioning provisions.
4. **Community Amenities**: Janaza (funeral preparation) staging, vehicle/bike parking, and maktab/library.

**F-021** implements a structured **Mosque Facilities & Capacity Taxonomy**:
- Relational `MosqueFacility` 1:1 entity bound to `Mosque`.
- Server-enforced mutation authority: only verified local `MOSQUE_ADMIN`s, authorized staff (`F-020`), or global platform admins can update facility records.
- PostGIS spatial search integration: filtering nearest mosques by facility criteria (e.g. `hasFemalePrayerSpace=true`, `hasWheelchairAccess=true`, `hasAirConditioning=true`, `minCapacity=500`).
- Strict adherence to PRD Section 6 "Visible Unknowns" policy: unverified or unreported fields remain `null` and are explicitly rendered as "Not Reported" rather than misleading boolean negatives.

---

## 2. Business Invariants & Invariant Rules

1. **Strict 1:1 Cardinality**: Each `Mosque` entity can have at most one associated `MosqueFacility` record. Deleting a mosque cascades to delete its facility record (`onDelete: Cascade`).
2. **Tiered Mutation Authority**:
   - Only users who are verified `MOSQUE_ADMIN`s (`F-020`) of that specific mosque, or hold global platform `admin`/`moderator` roles, can invoke `PUT /api/v1/mosques/:id/facilities`.
   - General musallis cannot directly mutate facility data. They propose amendments via the existing crowdsourced suggestions workflow (`F-006`).
3. **Atomic Audit Logging**: Every create or update of `MosqueFacility` must record an immutable `AuditLog` row capturing the actor, previous state, and updated state in the same PostgreSQL `$transaction`.
4. **Visible Unknowns Policy**: Unreported boolean or integer fields MUST remain `null` (not artificially defaulted to `false` or `0` if unknown).
5. **Zero Extra Infrastructure Boundary**: Spatial filtering on facilities is executed directly within PostgreSQL/PostGIS using `ST_DWithin` and relational `LEFT JOIN`s—no ElasticSearch, MeiliSearch, or Redis caches are permitted.
6. **Non-Negative Bounds Validation**: All capacity and count fields (`totalCapacity`, `wuduCapacity`, `femaleCapacity`, `toiletCount`) must be non-negative integers ($\ge 0$).

---

## 3. Data Model Reference

### 3.1 Prisma Schema (`prisma/schema/facilities.module/facilities.prisma`)

```prisma
model MosqueFacility {
  id                    String    @id @default(cuid())
  mosqueId              String    @unique
  mosque                Mosque    @relation(fields: [mosqueId], references: [id], onDelete: Cascade)

  // Overall Capacity
  totalCapacity         Int?
  toiletCount           Int?

  // Ablution (Wudu)
  hasSeparateWudu       Boolean?  @default(false)
  wuduCapacity          Int?

  // Women's Facilities
  hasFemalePrayerSpace  Boolean?  @default(false)
  femaleCapacity        Int?

  // Accessibility
  hasWheelchairAccess   Boolean?  @default(false)
  hasRamp               Boolean?  @default(false)

  // Climate Control
  hasAirConditioning    Boolean?  @default(false)
  hasFan                Boolean?  @default(true)

  // Community Amenities
  hasJanazaService      Boolean?  @default(false)
  hasParkingCar         Boolean?  @default(false)
  hasParkingBike        Boolean?  @default(false)
  hasLibraryMaktab      Boolean?  @default(false)

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([hasFemalePrayerSpace, hasWheelchairAccess])
  @@index([hasAirConditioning])
  @@index([totalCapacity])
}
```

---

## 4. REST API Contracts

### 4.1 Get Mosque Facilities
- **Method & Route**: `GET /api/v1/mosques/:id/facilities`
- **Access**: Public
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "mosqueId": "clx...",
    "totalCapacity": 1200,
    "toiletCount": 8,
    "hasSeparateWudu": true,
    "wuduCapacity": 40,
    "hasFemalePrayerSpace": true,
    "femaleCapacity": 150,
    "hasWheelchairAccess": true,
    "hasRamp": true,
    "hasAirConditioning": true,
    "hasFan": true,
    "hasJanazaService": true,
    "hasParkingCar": false,
    "hasParkingBike": true,
    "hasLibraryMaktab": true,
    "updatedAt": "2026-09-30T10:00:00Z"
  }
}
```
*If no facilities have been reported yet, `data` is `null` with a `200 OK` status.*

### 4.2 Upsert Mosque Facilities
- **Method & Route**: `PUT /api/v1/mosques/:id/facilities`
- **Access**: Authenticated (`MOSQUE_ADMIN` of this mosque, or global `admin`/`moderator`)
- **Request Body (DTO)**:
```json
{
  "totalCapacity": 1200,
  "toiletCount": 8,
  "hasSeparateWudu": true,
  "wuduCapacity": 40,
  "hasFemalePrayerSpace": true,
  "femaleCapacity": 150,
  "hasWheelchairAccess": true,
  "hasRamp": true,
  "hasAirConditioning": true,
  "hasFan": true,
  "hasJanazaService": true,
  "hasParkingCar": false,
  "hasParkingBike": true,
  "hasLibraryMaktab": true
}
```
- **Error Responses**:
  - `400 Bad Request`: Negative integers, invalid payload types.
  - `401 Unauthorized`: Missing or invalid bearer token.
  - `403 Forbidden`: User is not a verified `MOSQUE_ADMIN` for this mosque or global admin.
  - `404 Not Found`: Mosque does not exist.

### 4.3 Spatial Nearby Discovery with Facility Filtering
- **Method & Route**: `GET /api/v1/mosques/nearby`
- **Query Parameters Added**:
  - `hasFemalePrayerSpace`: boolean (`true`)
  - `hasWheelchairAccess`: boolean (`true`)
  - `hasAirConditioning`: boolean (`true`)
  - `hasJanazaService`: boolean (`true`)
  - `minCapacity`: integer (`100`..`10000`)

---

## 5. Extracted Implementation Checklist

- [x] Add `MosqueFacility` Prisma model in `prisma/schema/facilities.module/facilities.prisma`.
- [x] Generate and apply database migration `facilities_taxonomy_release2`.
- [x] Implement `FacilitiesModule`, `FacilitiesService`, and `FacilitiesController` in `backend-nest-prisma`.
- [x] Enforce mosque-scoped RBAC authorization (`MosqueStaffRole` or global admin check) for facility upserts.
- [x] Update `SearchService` / `NearbyService` PostGIS raw SQL query with facility joins and filters.
- [x] Implement backend unit and e2e integration tests for facilities module and filtered search.
- [x] Add TypeScript types and API client functions in `frontend/src/lib/api.ts`.
- [x] Build Ferio-designed `MosqueFacilitiesCard` on `/mosques/[id]` with visual badge indicators.
- [x] Build `EditFacilitiesModal` accessible to verified mosque administrators.
- [x] Add facility filter chips ("Women's Area", "Wheelchair", "AC") to the main map search bar.

---

## 6. Implementation Slices & Proof of Completion

### TK-FAC-01: Facilities Backend Schema, Service, RBAC & Spatial Search Integration
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Add the `MosqueFacility` model to the modular schema, build the facilities CRUD service with atomic audit logging, enforce mosque-scoped authorization, and update the PostGIS nearby search query with facility filters.
- **Acceptance Criteria**:
  - [x] Migration applies cleanly without affecting existing mosques.
  - [x] `GET /api/v1/mosques/:id/facilities` returns facility record or `null` for unconfigured mosques.
  - [x] `PUT /api/v1/mosques/:id/facilities` validates non-negative integers, allows only verified mosque admins/platform admins, and logs an `AuditLog` row.
  - [x] `GET /api/v1/mosques/nearby?hasFemalePrayerSpace=true` correctly filters mosques in PostGIS with sub-50ms latency.
  - [x] Full automated test suite passes (`npm test`).
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema/facilities.module/facilities.prisma`
  - Migration: `backend-nest-prisma/prisma/migrations/20260930150000_facilities_taxonomy_release2/migration.sql`
  - Module: `backend-nest-prisma/src/features/facilities/facilities.module.ts`
  - Service: `backend-nest-prisma/src/features/facilities/facilities.service.ts`
  - Controller: `backend-nest-prisma/src/features/facilities/facilities.controller.ts`
  - Search: `backend-nest-prisma/src/features/mosques/mosques.service.ts`
  - Tests: `backend-nest-prisma/src/features/facilities/facilities.service.spec.ts`

### TK-FAC-02: Ferio Frontend Amenities Card, Admin Edit Modal & Search Filter Chips
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Enhance the mosque profile view with an amenities card utilizing Ferio design tokens, provide an edit modal for verified staff, and add interactive facility filter chips to the map search interface.
- **Acceptance Criteria**:
  - [x] Profile displays facilities clearly, with distinct badges for verified amenities and "Not Reported" for unknown values.
  - [x] Verified mosque admins see an "Edit Facilities" button opening the management modal with form validation.
  - [x] Map search bar includes toggles for "Women's Area", "Wheelchair", "AC", updating query params and map markers in real-time.
  - [x] Responsive across mobile and desktop viewports with zero layout shift.
  - [x] Production build passes (`npm run build`).
- **Implementation Files**:
  - Types: `frontend/src/types/mosque.ts`
  - API: `frontend/src/lib/api.ts`
  - Component: `frontend/src/components/MosqueFacilitiesCard.tsx`
  - Component: `frontend/src/components/EditFacilitiesModal.tsx`
  - Component: `frontend/src/components/MosqueFacilitiesSection.tsx`
  - Page: `frontend/src/app/mosques/[id]/page.tsx`
  - Filter: `frontend/src/app/page.tsx`
