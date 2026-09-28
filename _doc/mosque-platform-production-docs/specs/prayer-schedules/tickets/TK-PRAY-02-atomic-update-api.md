# TK-PRAY-02: Atomic Update & Rollback Service API

## Spec
Parent Spec: [prayer-schedules.md](../prayer-schedules.md)

## Status
**Completed** `[x]`

## Priority
Critical

---

## Description
Implement the transactional update service that persists modifications to active prayer schedules and simultaneously writes historical audit records within an atomic database transaction.

## Acceptance Criteria
- [x] Endpoint `PUT /api/v1/prayer-schedules/:mosqueId` accepts validated `UpdatePrayerScheduleDto`.
- [x] Input times validated against 24h format regex `^([01]\d|2[03]):[0-5]\d$`.
- [x] Service executes `prisma.$transaction` creating history snapshot.
- [x] Reverts entirely if history record fails to insert.
- [x] Unit tests cover successful updates and transaction rollback (`prayer-schedules.service.spec.ts`).

## Implementation Files
- DTO: `backend-nest-prisma/src/features/prayer-schedules/dto/update-prayer-schedule.dto.ts`
- Service: `backend-nest-prisma/src/features/prayer-schedules/prayer-schedules.service.ts`
- Controller: `backend-nest-prisma/src/features/prayer-schedules/prayer-schedules.controller.ts`
- Tests: `backend-nest-prisma/src/features/prayer-schedules/prayer-schedules.service.spec.ts`
