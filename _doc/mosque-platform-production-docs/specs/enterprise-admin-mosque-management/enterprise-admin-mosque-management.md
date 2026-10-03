---
id: F-032
name: Enterprise Admin Mosque Management, Directory & Report Resolution Console
phase: 3
status: completed

depends_on:
  - F-001
  - F-002
  - F-003
  - F-004
  - F-006
  - F-010
  - F-020
  - F-021
  - F-026

blocks: []

parallel_with: []

source:
  - 01-PRD-PRODUCTION.md#verification-and-moderation
  - 01-PRD-PRODUCTION.md#verified-mosque-community-roles
  - 02-SYSTEM-ARCHITECTURE.md#authorization-model
  - 03-DATA-API-CONTRACTS.md#moderation-contracts
  - 06-IMPLEMENTATION-CHECKLIST.md#l-admin-verification-and-moderation
---

# Feature Specification: Enterprise Admin Mosque Management, Directory & Report Resolution Console

## 1. Overview
The Enterprise Admin Mosque Management Console transforms the admin experience from a passive "pending-only queue" into an enterprise-grade administrative hub. Administrators and moderators can:
1. Browse, search, filter, and inspect **all mosques** across Bangladesh with enterprise server-side pagination, status filters, and city segmentation.
2. Drill into any mosque to view complete operational context: core metadata, prayer timetable freshness, facility taxonomy, committee/staff roster, donation channels, and associated issue reports.
3. Perform direct administrative corrections and governance: edit mosque details, update or delete inaccurate committee/staff records, add missing personnel, and toggle facility amenities.
4. Seamlessly resolve user-submitted issue reports by inspecting the flagged mosque, performing the necessary corrections (e.g., removing a departed committee member or adding a new one), and marking the report resolved with an audit trail.

---

## 2. Business Invariants
1. **Administrative Authority & RBAC**:
   - Only authenticated users with `admin` or `moderator` platform roles can access the enterprise moderation console, soft-delete mosques, and override mosque verification statuses.
   - Mosque staff updates (`PATCH /mosques/:id/staff/:staffId`) can be performed by platform admins or verified local mosque administrators (`MOSQUE_ADMIN`, `MUTAWALLI`, `COMMITTEE_PRESIDENT`). Elevating to or revoking Super-Admin roles (`MOSQUE_ADMIN`, `MUTAWALLI`, `COMMITTEE_PRESIDENT`) is restricted strictly to platform administrators.
2. **Immutable Audit Logging**:
   - Every administrative update (mosque metadata change, soft-delete, staff edit, staff addition, staff removal, facility update, and report resolution) must write an immutable audit log record with actor details, previous value, new value, and contextual metadata.
3. **Soft-Delete Invariant**:
   - Deleting a mosque performs a logical soft-delete (`isDeleted: true`), preserving historical audit records and prayer schedules while excluding the mosque from public search, nearby queries, and active listings.
4. **Report Resolution Traceability**:
   - When a moderator resolves or rejects an issue report, resolution notes and reviewer ID are persisted, linking administrative action to community feedback.

---

## 3. Data Model Reference

### Prisma Schema Entities Utilized:
- **`Mosque`**: `id`, `name`, `address`, `landmark`, `city`, `country`, `latitude`, `longitude`, `operationalStatus`, `verificationStatus`, `isDeleted`, `createdAt`, `updatedAt`.
- **`MosqueStaff`**: `id`, `mosqueId`, `userId`, `role`, `customRoleTitle`, `name`, `contactNumber`, `startDate`, `imageUrl`, `isVerified`, `verifiedAt`, `verifiedById`.
- **`MosqueFacility`**: `id`, `mosqueId`, `hasWuduArea`, `hasSeparateWomenSpace`, `hasAirConditioning`, `hasParking`, `hasWheelchairAccess`, `hasJanazaFacility`, `capacity`, `floors`, `hasLibrary`, `hasMortuary`, `hasIslamicSchool`.
- **`MosqueReport`**: `id`, `mosqueId`, `userId`, `type`, `description`, `contactEmail`, `status`, `reviewedById`, `reviewedAt`, `resolutionNotes`.
- **`AuditLog`**: `id`, `action`, `entityType`, `entityId`, `actorId`, `actorRole`, `previousValue`, `newValue`, `metadata`, `createdAt`.

---

## 4. REST API Contracts

### Mosque Operations
- `GET /api/v1/mosques?page=1&limit=25&search=...&verificationStatus=...&operationalStatus=...&city=...`
  - Returns paginated list of mosques with `{ items: Mosque[], meta: { page, limit, total, totalPages } }`.
- `GET /api/v1/mosques/:id`
  - Returns complete mosque profile including facilities, prayer schedules, staff, announcements, and donation channels.
- `PATCH /api/v1/mosques/:id`
  - Payload: `{ name?, address?, landmark?, city?, operationalStatus?, verificationStatus?, latitude?, longitude?, capacity? }`
  - Updates mosque profile attributes and writes `MOSQUE_UPDATED` audit record.
- `DELETE /api/v1/mosques/:id`
  - Platform Admin / Moderator only.
  - Soft-deletes the mosque (`isDeleted: true`) and writes `MOSQUE_DELETED` audit record.

### Staff & Committee Operations
- `GET /api/v1/mosques/:id/staff`
  - Returns all staff members for the mosque (both verified and unverified).
- `POST /api/v1/mosques/:id/staff`
  - Payload: `{ role, customRoleTitle?, name, contactNumber?, startDate?, imageUrl? }`
  - Adds a new staff member and writes `MOSQUE_STAFF_ADDED` audit record.
- `PATCH /api/v1/mosques/:id/staff/:staffId`
  - Payload: `{ name?, role?, customRoleTitle?, contactNumber?, startDate?, imageUrl?, isVerified? }`
  - Updates an existing staff member and writes `MOSQUE_STAFF_UPDATED` audit record.
- `DELETE /api/v1/mosques/:id/staff/:staffId`
  - Removes a staff member and writes `MOSQUE_STAFF_REMOVED` audit record.

### Facilities Operations
- `PUT /api/v1/mosques/:id/facilities`
  - Payload: `UpsertFacilityDto`
  - Updates facility amenities and capacity.

### Issue Reports Operations
- `GET /api/v1/admin/reports?status=OPEN&mosqueId=...&page=1&limit=20`
  - Retrieves paginated reports, optionally filtered by mosque and status.
- `PATCH /api/v1/admin/reports/:id/status`
  - Payload: `{ status: 'RESOLVED' | 'REJECTED', resolutionNotes: string }`
  - Updates report status with reviewer ID and timestamp.

---

## 5. Extracted Implementation Checklist
- [x] Backend `UpdateStaffDto` with validation decorators for staff edits
- [x] Backend `updateStaff` service method with RBAC and audit logging
- [x] Backend `PATCH /mosques/:id/staff/:staffId` controller endpoint
- [x] Backend `softDelete` service method and `DELETE /mosques/:id` controller endpoint
- [x] Backend `UpdateMosqueDto` expanded with `verificationStatus`, `latitude`, `longitude`, `capacity`
- [x] Enterprise Mosque Directory UI with search, status filters, and pagination controls
- [x] Detailed Mosque Inspection Drawer/Modal displaying core metadata, facilities, staff, prayer times, and reports
- [x] Admin Staff CRUD modals (Add, Edit, Delete staff with Ferio styling)
- [x] Admin Mosque Info & Facilities edit controls
- [x] In-line report resolution workflow linking reported inaccuracies directly to mosque correction

---

## 6. Implementation Slices & Proof of Completion

### TK-ADM-01: Administrative Mosque Soft Delete & Staff Update APIs
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Implement backend endpoints allowing administrators to update staff records, soft-delete fraudulent or duplicate mosques, and update full mosque profile properties including coordinates and verification status.
- **Acceptance Criteria**:
  - [x] `UpdateStaffDto` validates fields and custom role title requirements.
  - [x] `CommunityService.updateStaff` checks permissions, updates record, and logs audit event.
  - [x] `CommunityController` exposes `PATCH /mosques/:id/staff/:staffId`.
  - [x] `MosquesService.softDelete` marks `isDeleted: true` and logs audit event.
  - [x] `MosquesController` exposes `DELETE /mosques/:id` guarded by admin/moderator roles.
  - [x] Unit tests cover `updateStaff` and `softDelete`.
- **Implementation Files**:
  - DTO: `backend-nest-prisma/src/features/community/dto/update-staff.dto.ts`
  - DTO: `backend-nest-prisma/src/features/mosques/dto/update-mosque.dto.ts`
  - Service: `backend-nest-prisma/src/features/community/community.service.ts`
  - Controller: `backend-nest-prisma/src/features/community/community.controller.ts`
  - Service: `backend-nest-prisma/src/features/mosques/mosques.service.ts`
  - Controller: `backend-nest-prisma/src/features/mosques/mosques.controller.ts`
  - Tests: `backend-nest-prisma/src/features/community/test/community.service.spec.ts`
  - Tests: `backend-nest-prisma/src/features/mosques/test/mosques.controller.spec.ts`

### TK-ADM-02: Enterprise Ferio Frontend Admin Console, Directory Pagination & Mosque Inspection
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Build an enterprise admin dashboard providing high-throughput pagination, multi-criteria filtering, full mosque inspection, staff management, and inline report resolution.
- **Acceptance Criteria**:
  - [x] Mosques Directory tab with enterprise server-side pagination (page number, limit selector 10/25/50/100, page jumps, total counts).
  - [x] Search by name/address/city with debounced query and status chips (All, Verified, Unverified, Rejected).
  - [x] Mosque detail inspection view showing core profile, staff directory, facilities, prayer times, and reports.
  - [x] Add, edit, and delete committee member modals with role selection and phone/photo support.
  - [x] Edit mosque details and edit facilities modals.
  - [x] Report resolution workflow allowing admin to inspect reported mosque, perform corrections, and close reports.
  - [x] Ferio visual language compliance (`#111114`, `#6e6e73`, `#e8e8ea`, `#fafafa`, white, hairline borders, pill buttons).
- **Implementation Files**:
  - Page: `frontend/src/app/admin/page.tsx`
  - Modals / Components: `frontend/src/components/AdminMosqueInspectionModal.tsx`, `frontend/src/components/AdminStaffModal.tsx`
