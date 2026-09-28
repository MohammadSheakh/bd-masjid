# TK-SRCH-02: Text Search & Multi-Criteria Filtering

## Spec
Parent Spec: [nearby-search.md](../nearby-search.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Provide a text-based search endpoint allowing queries across mosque name, landmark, address, and city, supporting pagination and status filters.

## Acceptance Criteria
- [x] Endpoint `GET /api/v1/mosques` accepts `search`, `city`, `verificationStatus`, `operationalStatus`, `page`, `limit`.
- [x] Performs case-insensitive matching across `name`, `address`, and `landmark`.
- [x] Returns standard pagination envelope: `data`, `meta: { total, page, limit, totalPages }`.
- [x] Protects against unbounded queries by enforcing `limit <= 100`.

## Implementation Files
- DTO: `backend-nest-prisma/src/features/mosques/dto/mosque-query.dto.ts`
- Service: `backend-nest-prisma/src/features/mosques/mosques.service.ts`
- Controller: `backend-nest-prisma/src/features/mosques/mosques.controller.ts`
