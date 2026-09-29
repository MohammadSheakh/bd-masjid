---
id: F-003
name: Authorization & Role-Based Access Control (RBAC)
phase: 1
status: completed

depends_on:
  - F-001
  - F-002

blocks:
  - F-006
  - F-008
  - F-010

parallel_with:
  - F-005

source:
  - 02-SYSTEM-ARCHITECTURE.md#authorization-model
  - 04-SECURITY-RELIABILITY-OPERATIONS.md#authorization-and-roles
  - 06-IMPLEMENTATION-CHECKLIST.md#d-authorization
---

# Feature Specification: Authorization & Role-Based Access Control (RBAC)

## 1. Overview
The Authorization & RBAC feature guarantees that only permitted actors execute sensitive operations. It enforces default-deny security and strictly prevents clients from spoofing user identities or roles.

## 2. Business Invariants
1. **Server-Derived Identity**: The server never accepts `userId`, `role`, or `isDeleted` from request bodies or parameters for privileged actions.
2. **Default-Deny Model**: All routes are protected by default unless decorated with `@Public()`.
3. **Role Hierarchy**: Roles are defined as `user`, `moderator`, `admin`. Elevated routes specify required roles via `@Roles(...)` metadata.

## 3. Extracted Implementation Checklist
- [x] Guest, User, Moderator, Admin role hierarchy in schema
- [x] Server-side authorization guards (`AuthGuard`, `PermissionsGuard`)
- [x] Actor identity derived from verified JWT payload
- [x] Default-deny privileged operations
- [x] Unit test matrix for authorization permissions (`permissions.guard.spec.ts`)

---

## 4. Implementation Slices & Proof of Completion

### TK-RBAC-01: Permissions Guard & Server Actor Derivation
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Enforce role-based access control across all controllers and extract caller identity into the execution context using custom NestJS decorators.
- **Acceptance Criteria**:
  - [x] Decorator `@CurrentUser()` cleanly provides the typed `UserPayload` to controller methods.
  - [x] Guard `PermissionsGuard` verifies `@Roles()` against actor role.
  - [x] Unauthenticated or unauthorized callers receive HTTP 401 or 403.
  - [x] Unit test suite verifies permission grant and denial scenarios (`permissions.guard.spec.ts`).
- **Implementation Files**:
  - Core Security: `backend-nest-prisma/src/core/security/permissions.guard.ts`
  - Tests: `backend-nest-prisma/src/core/security/permissions.guard.spec.ts`
