---
id: F-011
name: Observability, Health & Reliability
phase: 1
status: completed

depends_on: []

blocks: []

parallel_with:
  - F-001

source:
  - 02-SYSTEM-ARCHITECTURE.md#observability
  - 04-SECURITY-RELIABILITY-OPERATIONS.md#observability-baseline
  - 06-IMPLEMENTATION-CHECKLIST.md#p-observability
---

# Feature Specification: Observability, Health & Reliability

## 1. Overview
The Observability, Health & Reliability feature provides unified request correlation IDs, JSON structured logging with PII/credential sanitization, request latency metrics, health/readiness endpoints, and graceful connection draining.

## 2. Business Invariants
1. **Correlation Tracing**: Every inbound HTTP request receives or inherits `x-correlation-id`, which propagates across log entries and the error envelope.
2. **PII & Credential Sanitization**: Passwords, tokens, OTPs, secrets, and authorization headers are scrubbed before writing to logs.
3. **Liveness vs Readiness**: `/health/live` returns 200 if the process event loop is healthy; `/health/ready` returns 200 only if the PostgreSQL database connection responds successfully.

## 3. Extracted Implementation Checklist
- [x] Structured JSON logging via `StructuredLoggerService`
- [x] Request correlation ID middleware (`CorrelationIdMiddleware`)
- [x] In-memory request metrics tracking (`RequestMetricsService`)
- [x] Security event logging for brute-force and rate-limit violations
- [x] Liveness probe (`GET /health/live`)
- [x] Readiness probe (`GET /health/ready`) with DB ping
- [x] Graceful shutdown lifecycle hooks enabled in `main.ts`

---

## 4. Implementation Slices & Proof of Completion

### TK-OBS-01: Structured Logging & Correlation Tracing
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Implement correlation ID assignment and structured JSON logging with automatic PII and sensitive credential redaction.
- **Acceptance Criteria**:
  - [x] Middleware intercepts requests and extracts or generates `x-correlation-id`.
  - [x] Logger formats output as JSON with timestamp, level, context, correlationId, and message.
  - [x] `LogSanitizer` replaces values for keys like `password`, `token`, `secret`, `otp` with `[REDACTED]`.
  - [x] Unit test suites pass (`structured-logger.spec.ts`, `log-sanitizer.spec.ts`).
- **Implementation Files**:
  - Middleware: `backend-nest-prisma/src/core/security/correlation-id.middleware.ts`
  - Logger: `backend-nest-prisma/src/core/security/structured-logger.service.ts`
  - Sanitizer: `backend-nest-prisma/src/core/security/log-sanitizer.ts`
  - Tests: `backend-nest-prisma/src/core/security/structured-logger.spec.ts`

### TK-OBS-02: Health Probes & Operational Metrics
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Provide container-friendly readiness and liveness probes alongside real-time HTTP metrics recording response time distribution and error frequencies.
- **Acceptance Criteria**:
  - [x] Endpoint `GET /health/live` returns 200 immediately.
  - [x] Endpoint `GET /health/ready` executes Prisma `$queryRaw` to verify live DB connectivity; returns 503 if unreachable.
  - [x] In-memory metrics calculate request counts, 4xx/5xx counts, and response latency.
  - [x] Unit test suites pass (`operations-health.service.spec.ts`).
- **Implementation Files**:
  - Controller: `backend-nest-prisma/src/features/operations-health/operations-health.controller.ts`
  - Service: `backend-nest-prisma/src/features/operations-health/operations-health.service.ts`
  - Tests: `backend-nest-prisma/src/features/operations-health/operations-health.service.spec.ts`
