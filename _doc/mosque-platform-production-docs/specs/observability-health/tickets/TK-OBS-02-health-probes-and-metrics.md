# TK-OBS-02: Health Probes & Operational Metrics

## Spec
Parent Spec: [observability-health.md](../observability-health.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Provide container-friendly readiness and liveness probes alongside real-time HTTP metrics recording response time distribution and error frequencies.

## Acceptance Criteria
- [x] Endpoint `GET /health/live` returns 200 immediately.
- [x] Endpoint `GET /health/ready` executes Prisma `$queryRaw` to verify live DB connectivity; returns 503 if unreachable.
- [x] In-memory metrics calculate request counts, 4xx/5xx counts, and response latency.
- [x] Unit test suites pass (`operations-health.service.spec.ts`).

## Implementation Files
- Controller: `backend-nest-prisma/src/features/operations-health/operations-health.controller.ts`
- Service: `backend-nest-prisma/src/features/operations-health/operations-health.service.ts`
- Tests: `backend-nest-prisma/src/features/operations-health/operations-health.service.spec.ts`
