# ADR-007: Uniform API Error Contract, Correlation Tracking, and Logging Sanitization

## Status
**Accepted**

## Date
2026-09-28

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In production web applications, raw unhandled exceptions can leak database schema details, SQL statements, environment secrets, and stack traces to clients. Furthermore, troubleshooting errors across distributed browser requests without a unified correlation identifier is difficult. Conversely, over-logging sensitive user data (passwords, tokens, phone numbers) violates privacy principles.

## Decision
1. **Uniform Error Envelope**:
   - All HTTP exceptions are intercepted by a global NestJS `HttpExceptionFilter` and formatted into a standard JSON envelope:
   ```json
   {
     "success": false,
     "statusCode": 400,
     "message": "Validation failed",
     "error": "Bad Request",
     "timestamp": "2026-09-28T19:50:00.000Z",
     "path": "/api/v1/mosques",
     "correlationId": "req-123e4567-e89b-12d3-a456-426614174000"
   }
   ```
2. **Correlation ID Tracing**:
   - `CorrelationIdMiddleware` assigns or propagates `x-correlation-id` on every inbound HTTP request.
   - The correlation ID is threaded through `RequestContext`, logged in every log line, and returned in the HTTP response header.
3. **Structured Logging & Automated Sanitization**:
   - Logs are output as structured JSON via `StructuredLoggerService`.
   - `LogSanitizer` automatically intercepts and redacts sensitive keys: `password`, `token`, `secret`, `authorization`, `creditCard`, `otp`, `refreshToken`.
4. **Lightweight In-Memory Metrics**:
   - `RequestMetricsService` collects latency percentiles, status code distributions (2xx/4xx/5xx), and rate-limit hits without requiring an external APM agent for baseline observability.
   - Probes exposed via `/health/live` and `/health/ready`.

## Consequences

### Positive
- **Predictable Client Consumption**: The frontend can handle all API errors uniformly using a single error handler.
- **Zero Information Leakage**: Database error internals are suppressed from public responses while captured safely in server-side logs.
- **Rapid Debuggability**: A user reporting an issue with a correlation ID allows engineers to pinpoint the exact failure in seconds.

### Tradeoffs & Mitigations
- **Error Filter Overhead**: Custom error interception runs on every exception.
  - *Mitigation*: The filter is optimized with minimal allocations and zero external I/O.

## References
- Security Baseline: `_doc/mosque-platform-production-docs/04-SECURITY-RELIABILITY-OPERATIONS.md`
- Filter & Logger: `backend-nest-prisma/src/core/security/`
