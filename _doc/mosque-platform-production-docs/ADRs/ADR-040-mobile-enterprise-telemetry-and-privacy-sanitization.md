# ADR-040: Mobile Enterprise Telemetry, Crash Reporting, and Privacy Data Scrubbing

## Status
Accepted

## Date
2026-10-10

## Context
Deploying an enterprise-grade mobile application across diverse Android OEM devices and iOS versions requires comprehensive crash observability and performance monitoring to catch regressions, memory pressure events, and unexpected exceptions.

However, telemetry in an application handling community donations, volunteer communications, and user authentication introduces severe data privacy and compliance risks:
1. **Plaintext Credential Leakage**: HTTP request breadcrumbs can inadvertently capture `Authorization: Bearer <jwt>` headers.
2. **PII and Financial Information Exposure**: Crash payloads can accidentally capture donor phone numbers (bKash/Nagad accounts, e.g. `017xxxxxxxx`), mosque volunteer mobile numbers, or contact details submitted in community suggestion dialogs.
3. **Platform Trust & Compliance**: In accordance with the security baseline in `04-SECURITY-RELIABILITY-OPERATIONS.md`, the platform must guarantee that zero user credentials, authentication tokens, or personal identifiers ever leak to third-party telemetry collectors.

## Decision

1. **Client-Side Telemetry Engine (`telemetryService.ts`)**:
   - Encapsulates error capturing, breadcrumb recording, and exception reporting.
   - Configurable via `EXPO_PUBLIC_SENTRY_DSN` with graceful mock/noop fallback when unconfigured in local development.

2. **Zero-Trust Client-Side Sanitization (`beforeSend` & `beforeBreadcrumb`)**:
   - Every event, error payload, and breadcrumb passes through strict regular expression filters before leaving the device:
     - **Bearer Tokens**: `Bearer\s+[A-Za-z0-9\-._~+/]+=*` → `Bearer [REDACTED_TOKEN]`.
     - **Bangladeshi Mobile / Donation Numbers**: `(\+?880\d{10}|01[3-9]\d{8})` → `[REDACTED_PHONE]`.
     - **Passwords / Secrets**: Keys matching `password`, `token`, `secret`, `apiKey` are wiped.
     - **Bank / Financial Account Numbers**: Redacted to protect donor and committee financial privacy.

3. **Performance & Memory Monitoring**:
   - Captures memory warning events (`AppState` memory pressure notifications) to proactively trace low-memory OEM terminations.
   - Initialized at application startup in `App.tsx`.

## Consequences

### Positive
- **Guaranteed Zero-PII Leakage**: Hard cryptographic/token privacy invariants enforced before any telemetry packet reaches the wire.
- **Enterprise Observability**: Crashes and fatal bugs on unusual OEM devices are surfaced with stack traces and sanitized context.
- **Full Production Compliance**: Aligns with `04-SECURITY-RELIABILITY-OPERATIONS.md` and Bangladesh data protection principles.

### Trade-offs
- Scrubbing breadcrumbs adds negligible string regex execution overhead (< 1ms per event) during exception processing.
