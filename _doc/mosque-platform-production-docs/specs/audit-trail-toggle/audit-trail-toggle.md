---
id: F-037
name: Dynamic System Audit Trail Toggle & Storage Governance
phase: 3
status: planned
depends_on:
  - F-001
  - F-003
  - F-011
  - F-032
blocks: []
parallel_with: []
source:
  - 02-SYSTEM-ARCHITECTURE.md#backend-boundary
  - 04-SECURITY-RELIABILITY-OPERATIONS.md#audit-trail
  - 08-PRODUCTION-ENGINEERING-STANDARD.md#reliability
---

# Feature Specification: Dynamic System Audit Trail Toggle & Storage Governance

## 1. Overview
The platform captures administrative lifecycle events across mosques, prayer schedules, verified claims, and announcements in an append-only `AuditLog` table. This specification establishes dynamic runtime control allowing administrators to enable or disable audit record writes on demand from the Admin Dashboard, preventing database storage exhaustion in resource-constrained environments.

## 2. Business Invariants
1. **Zero Database Writes When Disabled**: When `AuditConfig.enabled` is false, `AuditService.record()` must return immediately without executing `AuditLog.create()`.
2. **Zero-Latency In-Memory Evaluation**: To prevent doubling database query volume across application mutations, the active audit state must be cached in-memory and updated synchronously upon setting mutation.
3. **Durable Persistence**: Configuration changes must be persisted in PostgreSQL under `AuditConfig` singleton row (`id = 'default'`) and reloaded automatically on application bootstrap.
4. **Historical Immutability**: Disabling audit logging only halts future log generation; existing historical audit records remain intact, readable, and searchable in the Admin Dashboard.
5. **Authorization Enforcement**: Only users with `admin` role and `audit.read` permission may inspect or update the audit configuration.

## 3. Data Model Reference
```prisma
model AuditConfig {
  id        String   @id @default("default")
  enabled   Boolean  @default(true)
  updatedAt DateTime @updatedAt
  updatedBy String?
}
```

## 4. REST API Contracts
- `GET /api/v1/admin/audit-logs/settings`
  - **Auth**: Bearer Token (`admin`, `audit.read`)
  - **Response 200**:
    ```json
    {
      "enabled": true,
      "updatedAt": "2026-10-04T12:00:00.000Z",
      "updatedBy": "usr-admin-uuid"
    }
    ```
- `PATCH /api/v1/admin/audit-logs/settings`
  - **Auth**: Bearer Token (`admin`, `audit.read`)
  - **Body**: `{ "enabled": boolean }`
  - **Response 200**:
    ```json
    {
      "enabled": false,
      "updatedAt": "2026-10-04T12:05:00.000Z",
      "updatedBy": "usr-admin-uuid"
    }
    ```

## 5. Extracted Implementation Checklist
- [ ] Create `AuditConfig` model in Prisma and generate database migration.
- [ ] Implement in-memory cached state and module lifecycle loader in `AuditService`.
- [ ] Add bypass logic in `AuditService.record()` when disabled.
- [ ] Add `GET` and `PATCH` configuration endpoints in `AuditController`.
- [ ] Build Admin Dashboard UI toggle controls and status banner in Tab 7 (Audit Trail).
- [ ] Add unit tests for `AuditService` and `AuditController` verifying enable/disable behavior.

---

## 6. Implementation Slices & Proof of Completion

### TK-AUD-01: Audit Configuration Prisma Model & Migration
- **Status**: `[ ] Pending` | **Priority**: Critical
- **Description**: Add `AuditConfig` singleton model in `audit.prisma`, build schema, and create migration.
- **Acceptance Criteria**:
  - [ ] `AuditConfig` table created with `id`, `enabled`, `updatedAt`, `updatedBy`.
  - [ ] Prisma client generated with types for `AuditConfig`.
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema/audit.module/audit.prisma`
  - Migration: `backend-nest-prisma/prisma/migrations/20261004150000_add_audit_config_table/migration.sql`

### TK-AUD-02: Backend Audit Service Toggle, Endpoints & Unit Tests
- **Status**: `[ ] Pending` | **Priority**: Critical
- **Description**: In-memory caching, bypass logic in `record()`, `GET`/`PATCH` endpoints in `AuditController`, and comprehensive unit tests.
- **Acceptance Criteria**:
  - [ ] `AuditService.record()` executes `AuditLog.create` when enabled and skips when disabled.
  - [ ] `PATCH /api/v1/admin/audit-logs/settings` updates both database and in-memory cache.
  - [ ] Unit tests pass for all branches.
- **Implementation Files**:
  - Service: `backend-nest-prisma/src/features/audit/audit.service.ts`
  - Controller: `backend-nest-prisma/src/features/audit/audit.controller.ts`
  - Tests: `backend-nest-prisma/src/features/audit/test/audit.service.spec.ts`

### TK-AUD-03: Admin Dashboard Audit Trail Toggle UI
- **Status**: `[ ] Pending` | **Priority**: High
- **Description**: Add real-time audit toggle card, status badges, and pause notification banner in Admin Dashboard.
- **Acceptance Criteria**:
  - [ ] Admin can see current status (Active vs Paused).
  - [ ] Admin can click toggle button to switch state with instant visual feedback.
  - [ ] API integration handles loading states and errors cleanly.
- **Implementation Files**:
  - Page: `frontend/src/app/admin/page.tsx`
  - API Client: `frontend/src/lib/api.ts`
