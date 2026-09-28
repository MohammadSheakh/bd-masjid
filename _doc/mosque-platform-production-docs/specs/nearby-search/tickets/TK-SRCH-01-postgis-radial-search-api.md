# TK-SRCH-01: PostGIS Spherical Radial Search API

## Spec
Parent Spec: [nearby-search.md](../nearby-search.md)

## Status
**Completed** `[x]`

## Priority
Critical

---

## Description
Implement the high-performance `/api/v1/mosques/nearby` endpoint utilizing PostGIS spatial queries to find mosques within a bounded radius.

## Acceptance Criteria
- [x] Input query parameters: `latitude` (float), `longitude` (float), `radius` (integer, max 50000m, default 5000m), `limit` (integer, max 100, default 20).
- [x] Spatial math performed using `ST_DWithin` on geography coordinates.
- [x] Returns results ordered by distance ascending.
- [x] Computes distance in meters and returns as `distance` field.
- [x] Includes active prayer schedule summary for immediate display.

## Implementation Files
- DTO: `backend-nest-prisma/src/features/mosques/dto/nearby-mosques.dto.ts`
- Service: `backend-nest-prisma/src/features/mosques/mosques.service.ts`
- Controller: `backend-nest-prisma/src/features/mosques/mosques.controller.ts`
