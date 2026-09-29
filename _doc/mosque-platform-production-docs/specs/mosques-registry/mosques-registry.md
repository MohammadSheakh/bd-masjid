---
id: F-004
name: Mosque Registry & Creation Slice
phase: 1
status: completed

depends_on:
  - F-001

blocks:
  - F-005
  - F-006
  - F-007
  - F-008
  - F-009
  - F-010

parallel_with:
  - F-002

source:
  - 01-PRD-PRODUCTION.md#core-mosque-registry
  - 03-DATA-API-CONTRACTS.md#mosque-endpoints
  - 06-IMPLEMENTATION-CHECKLIST.md#e-mosque-registry
---

# Feature Specification: Mosque Registry & Creation Slice

## 1. Overview
The Mosque Registry is the core domain of the platform, enabling users to discover mosques, view detailed profiles (including facilities and current status), and contribute new mosques via an interactive pin-drop map interface with spatial duplicate detection.

## 2. Business Invariants
1. **Name and Coordinates Required**: Every mosque must possess a non-empty name and valid WGS84 geographic coordinates (`latitude` between -90 and 90, `longitude` between -180 and 180).
2. **Spatial Proximity Duplicate Guard**: New submissions must be checked against existing mosques within a 50-meter spherical radius using PostGIS. If duplicate candidates exist, warning or conflict is enforced.
3. **Default Unverified State**: Every newly created mosque enters the system with `verificationStatus = UNVERIFIED`.
4. **Server-Derived Provenance**: If the creator is authenticated, `createdById` is derived from the server's verified JWT context, not trusted from client payloads.
5. **Direct URL Accessibility**: Mosque profiles (`/mosques/[id]`) must be fully accessible and render completely without requiring the map to load.

## 3. Data Model Reference (`Mosque`)
- `id`: CUID primary key
- `name`: string (required)
- `latitude`, `longitude`: Float (WGS84)
- `address`, `landmark`, `city`, `country`: string
- `operationalStatus`: `OPEN` | `TEMPORARILY_CLOSED` | `PERMANENTLY_CLOSED` | `UNDER_CONSTRUCTION` | `UNKNOWN`
- `verificationStatus`: `UNVERIFIED` | `PENDING_VERIFICATION` | `VERIFIED` | `REJECTED`
- Facilities: `hasWuduArea`, `hasSeparateWomenSpace`, `hasAirConditioning`, `hasParking`, `hasWheelchairAccess`, `hasJanazaFacility`, `capacity`
- Relations: `prayerSchedule`, `attendances`, `suggestions`, `reports`, `staffMembers`, `donationMethods`

## 4. REST API Contracts
- `POST /api/v1/mosques` — Create a new mosque
- `POST /api/v1/mosques/check-duplicate` — Check for candidate duplicates within 50m
- `GET /api/v1/mosques/:id` — Public mosque profile with facilities and prayer times
- `PATCH /api/v1/mosques/:id` — Update mosque details (restricted to staff/moderator/admin)

## 5. Extracted Implementation Checklist
- [x] Add Mosque UI modal with interactive map pin-drop
- [x] Name validation and coordinate boundary validation
- [x] Optional address and landmark support
- [x] Backend creation API (`POST /api/v1/mosques`)
- [x] Server-side actor derivation for creator provenance
- [x] PostGIS duplicate proximity query (`ST_DWithin` 50m)
- [x] Interactive pre-flight duplicate warning in modal UI
- [x] Default unverified state (`MosqueVerificationStatus.UNVERIFIED`)
- [x] Created mosque immediately reflected on frontend map
- [x] Dedicated profile page (`/mosques/[id]`) operating independently of map
- [x] Backend service integration tests (`mosques.service.spec.ts`)
- [ ] Automated browser E2E test for mosque creation flow

---

## 6. Implementation Slices & Proof of Completion

### TK-MOSQ-01: Mosque Database Schema & Spatial Indexing
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Define the Prisma schema for the `Mosque` entity, supporting geographic coordinates, operational statuses, verification lifecycle, capacity, facilities, and relational joins to prayer schedules and community entities. Configure appropriate database indexes including spatial indexing.
- **Acceptance Criteria**:
  - [x] Model `Mosque` defined in Prisma with primary key CUID.
  - [x] Enums `MosqueOperationalStatus` (`OPEN`, `TEMPORARILY_CLOSED`, `PERMANENTLY_CLOSED`, `UNDER_CONSTRUCTION`, `UNKNOWN`) and `MosqueVerificationStatus` (`UNVERIFIED`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`) configured.
  - [x] Facility boolean flags (`hasWuduArea`, `hasSeparateWomenSpace`, `hasAirConditioning`, `hasParking`, `hasWheelchairAccess`, `hasJanazaFacility`) with sensible defaults.
  - [x] Composite indexes configured on `[latitude, longitude]`, `[verificationStatus, operationalStatus, isDeleted]`, and `[name, isDeleted]`.
  - [x] Foreign key relations to `User` for `createdById` and `verifiedById` with `onDelete: SetNull`.
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema.prisma`
  - Module: `backend-nest-prisma/src/features/mosques/`

### TK-MOSQ-02: Mosque Creation & Duplicate Detection API
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Implement the NestJS backend endpoints for creating mosques and checking candidate duplicates within 50 meters using PostGIS spherical geometry queries.
- **Acceptance Criteria**:
  - [x] Endpoint `POST /api/v1/mosques` implemented with validation of `CreateMosqueDto`.
  - [x] Endpoint `POST /api/v1/mosques/check-duplicate` accepting `latitude` and `longitude`.
  - [x] PostGIS query `ST_DWithin` calculates candidates within 50 meters.
  - [x] Server-side actor derivation ensures `createdById` is attached from JWT if authenticated.
  - [x] New mosques automatically assigned `verificationStatus = UNVERIFIED`.
  - [x] Unit/integration tests verify duplicate conflict responses (`mosques.service.spec.ts`).
- **Implementation Files**:
  - Controller: `backend-nest-prisma/src/features/mosques/mosques.controller.ts`
  - Service: `backend-nest-prisma/src/features/mosques/mosques.service.ts`
  - DTOs: `backend-nest-prisma/src/features/mosques/dto/create-mosque.dto.ts`
  - Tests: `backend-nest-prisma/src/features/mosques/mosques.service.spec.ts`

### TK-MOSQ-03: Mosque Profile Endpoint & Standalone Page
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Provide a public endpoint and Next.js standalone page for viewing any mosque by ID, including its operational status, facilities, current prayer schedule, and attendance stats. The page must function directly via URL without dependencies on the interactive map.
- **Acceptance Criteria**:
  - [x] Endpoint `GET /api/v1/mosques/:id` returns comprehensive mosque details, facilities, current prayer schedule, and attendance counts.
  - [x] Explicit response projection ensures sensitive internal fields are omitted.
  - [x] Next.js route `/mosques/[id]` renders server-side or dynamic profile.
  - [x] Shows operational badges (`OPEN`, `TEMPORARILY_CLOSED`), verification badge (`VERIFIED`, `UNVERIFIED`).
  - [x] Unknown attributes gracefully displayed as "Not specified".
  - [x] Works seamlessly on direct link / page refresh.
- **Implementation Files**:
  - API Endpoint: `backend-nest-prisma/src/features/mosques/mosques.controller.ts`
  - Frontend Page: `frontend/src/app/mosques/[id]/page.tsx`
  - Modal View: `frontend/src/components/MosqueDetailModal.tsx`

### TK-MOSQ-04: Add Mosque Modal & Pin-Drop UI
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Build the interactive Add Mosque modal on the frontend allowing users to specify mosque name, drag and place a pin on a Leaflet map, view instant duplicate warnings, and submit the new mosque.
- **Acceptance Criteria**:
  - [x] Modal component `AddMosqueModal.tsx` accessible via "Add Mosque" button in navigation.
  - [x] Embedded interactive Leaflet pin-drop allowing manual coordinate adjustment or map click.
  - [x] Debounced call to `/api/v1/mosques/check-duplicate` displaying warning if a mosque exists within 50m.
  - [x] Mandatory name input and optional facility checkboxes.
  - [x] Submitting updates local map state immediately and provides feedback.
  - [ ] Browser E2E automation test for full submission flow (deferred to CI/CD E2E stage per 05-TESTING-STRATEGY §3).
- **Implementation Files**:
  - Frontend Component: `frontend/src/components/AddMosqueModal.tsx`
  - Parent View: `frontend/src/app/page.tsx`
