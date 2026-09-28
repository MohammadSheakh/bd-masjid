# TK-MOSQ-02: Mosque Creation & Duplicate Detection API

## Spec
Parent Spec: [mosques-registry.md](../mosques-registry.md)

## Status
**Completed** `[x]`

## Priority
Critical

---

## Description
Implement the NestJS backend endpoints for creating mosques and checking candidate duplicates within 50 meters using PostGIS spherical geometry queries.

## Acceptance Criteria
- [x] Endpoint `POST /api/v1/mosques` implemented with validation of `CreateMosqueDto`.
- [x] Endpoint `POST /api/v1/mosques/check-duplicate` accepting `latitude` and `longitude`.
- [x] PostGIS query `ST_DWithin` calculates candidates within 50 meters.
- [x] Server-side actor derivation ensures `createdById` is attached from JWT if authenticated.
- [x] New mosques automatically assigned `verificationStatus = UNVERIFIED`.
- [x] Unit/integration tests verify duplicate conflict responses (`mosques.service.spec.ts`).

## Implementation Files
- Controller: `backend-nest-prisma/src/features/mosques/mosques.controller.ts`
- Service: `backend-nest-prisma/src/features/mosques/mosques.service.ts`
- DTOs: `backend-nest-prisma/src/features/mosques/dto/create-mosque.dto.ts`
- Tests: `backend-nest-prisma/src/features/mosques/mosques.service.spec.ts`
