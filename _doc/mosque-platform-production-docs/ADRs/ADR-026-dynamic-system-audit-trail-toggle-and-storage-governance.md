# ADR-026: Dynamic System Audit Trail Toggle and Storage Capacity Governance

## Status
**Accepted**

## Date
2026-10-04

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
The platform implements an append-only audit trail in PostgreSQL (`AuditLog` model) tracking administrative actions, role claim approvals, prayer timetable adjustments, mosque verification status, and donation channel configurations.

While valuable for traceability and compliance, continuous insertion of JSON-heavy mutation logs rapidly inflates relational storage, especially in resource-constrained deployment environments. Administrators require the ability to dynamically toggle audit recording ON or OFF directly from the Admin Dashboard to prevent unbounded database growth when comprehensive auditing is not necessary.

Key operational requirements:
1. **Zero-Write When Disabled**: When audit logging is toggled OFF, `AuditService.record()` must completely bypass database writes (`client.auditLog.create()`), preventing database storage growth.
2. **Durable Persistence with Zero-Latency Mutation Checks**: The on/off configuration state must persist across backend service restarts in PostgreSQL, but must not introduce an extra database read query on every single audited mutation in the application.
3. **Admin Console Governance**: The Admin Dashboard Audit Trail view must provide an intuitive toggle to inspect and modify the current audit state with clear visual status indicators.

---

## Decision

### 1. Persistent Storage Model (`AuditConfig`)
We define a singleton configuration entity in PostgreSQL via Prisma:
```prisma
model AuditConfig {
  id        String   @id @default("default")
  enabled   Boolean  @default(true)
  updatedAt DateTime @updatedAt
  updatedBy String?
}
```
A database migration creates the `AuditConfig` table and seeds the default row with `id = 'default'` and `enabled = true`.

### 2. In-Memory Caching & $O(1)$ Bypass in `AuditService`
To avoid querying the database on every audit event:
- `AuditService` initializes an in-memory boolean flag `private isAuditEnabled: boolean = true` during `onModuleInit()`.
- `record(input, client)` evaluates `if (!this.isAuditEnabled) return;` synchronously before attempting database writes.
- When an administrator modifies the setting via `PATCH /api/v1/admin/audit-logs/settings`, `AuditService` updates PostgreSQL atomically via `upsert` and immediately synchronizes `this.isAuditEnabled`.

### 3. REST API Contracts
- `GET /api/v1/admin/audit-logs/settings`: Returns `{ enabled: boolean, updatedAt: Date, updatedBy?: string }`.
- `PATCH /api/v1/admin/audit-logs/settings`: Accepts `{ enabled: boolean }`, validates payload, updates database + in-memory cache, and returns the updated state.
- Both endpoints are guarded with `@Roles('admin')` and `@Permissions(PERMISSIONS.AUDIT_READ)`.

### 4. Admin Dashboard UI Controls
- Tab 7 ("Platform Audit Trail") renders an interactive audit toggle bar with real-time status:
  - **Active / Enabled**: Emerald badge with option to "Pause Audit Recording".
  - **Disabled / Paused**: Amber badge notifying that database write operations are paused, with an option to "Resume Audit Recording".
- Existing audit history remains accessible and filterable even when active recording is paused.

---

## Consequences

### Positive
- **Storage Conservation**: Eliminates database table bloat when administrators do not require ongoing transaction logging.
- **Zero Query Overhead**: In-memory caching ensures that standard application operations incur zero database overhead when evaluating audit eligibility.
- **Durable Across Restarts**: Database-backed configuration ensures preferences survive container restarts or deployments.

### Negative / Trade-offs
- While disabled, administrative actions leave no forensic history in `AuditLog`.
- *Mitigation*: The toggle action itself is logged in structured application logs with actor ID, and the dashboard clearly displays a warning banner whenever logging is inactive.
