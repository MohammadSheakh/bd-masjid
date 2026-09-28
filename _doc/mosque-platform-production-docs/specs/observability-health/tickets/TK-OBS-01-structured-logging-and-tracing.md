# TK-OBS-01: Structured Logging & Correlation Tracing

## Spec
Parent Spec: [observability-health.md](../observability-health.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Implement correlation ID assignment and structured JSON logging with automatic PII and sensitive credential redaction.

## Acceptance Criteria
- [x] Middleware intercepts requests and extracts or generates `x-correlation-id`.
- [x] Logger formats output as JSON with timestamp, level, context, correlationId, and message.
- [x] `LogSanitizer` replaces values for keys like `password`, `token`, `secret`, `otp` with `[REDACTED]`.
- [x] Unit test suites pass (`structured-logger.spec.ts`, `log-sanitizer.spec.ts`).

## Implementation Files
- Middleware: `backend-nest-prisma/src/core/security/correlation-id.middleware.ts`
- Logger: `backend-nest-prisma/src/core/security/structured-logger.service.ts`
- Sanitizer: `backend-nest-prisma/src/core/security/log-sanitizer.ts`
- Tests: `backend-nest-prisma/src/core/security/structured-logger.spec.ts`
