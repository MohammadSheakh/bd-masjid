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

## 4. Associated Tickets
- [TK-OBS-01: Structured Logging & Correlation Tracing](tickets/TK-OBS-01-structured-logging-and-tracing.md)
- [TK-OBS-02: Health Probes & Operational Metrics](tickets/TK-OBS-02-health-probes-and-metrics.md)
