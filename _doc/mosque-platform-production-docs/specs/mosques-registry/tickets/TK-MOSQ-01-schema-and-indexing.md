# TK-MOSQ-01: Mosque Database Schema & Spatial Indexing

## Spec
Parent Spec: [mosques-registry.md](../mosques-registry.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Define the Prisma schema for the `Mosque` entity, supporting geographic coordinates, operational statuses, verification lifecycle, capacity, facilities, and relational joins to prayer schedules and community entities. Configure appropriate database indexes including spatial indexing.

## Acceptance Criteria
- [x] Model `Mosque` defined in Prisma with primary key CUID.
- [x] Enums `MosqueOperationalStatus` (`OPEN`, `TEMPORARILY_CLOSED`, `PERMANENTLY_CLOSED`, `UNDER_CONSTRUCTION`, `UNKNOWN`) and `MosqueVerificationStatus` (`UNVERIFIED`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`) configured.
- [x] Facility boolean flags (`hasWuduArea`, `hasSeparateWomenSpace`, `hasAirConditioning`, `hasParking`, `hasWheelchairAccess`, `hasJanazaFacility`) with sensible defaults.
- [x] Composite indexes configured on `[latitude, longitude]`, `[verificationStatus, operationalStatus, isDeleted]`, and `[name, isDeleted]`.
- [x] Foreign key relations to `User` for `createdById` and `verifiedById` with `onDelete: SetNull`.

## Implementation Files
- Schema: `backend-nest-prisma/prisma/schema.prisma`
- Module: `backend-nest-prisma/src/features/mosques/`
