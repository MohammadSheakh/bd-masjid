# TK-RBAC-01: Permissions Guard & Server Actor Derivation

## Spec
Parent Spec: [authorization-rbac.md](../authorization-rbac.md)

## Status
**Completed** `[x]`

## Priority
Critical

---

## Description
Enforce role-based access control across all controllers and extract caller identity into the execution context using custom NestJS decorators.

## Acceptance Criteria
- [x] Decorator `@CurrentUser()` cleanly provides the typed `UserPayload` to controller methods.
- [x] Guard `PermissionsGuard` verifies `@Roles()` against actor role.
- [x] Unauthenticated or unauthorized callers receive HTTP 401 or 403.
- [x] Unit test suite verifies permission grant and denial scenarios (`permissions.guard.spec.ts`).

## Implementation Files
- Core Security: `backend-nest-prisma/src/core/security/permissions.guard.ts`
- Tests: `backend-nest-prisma/src/core/security/permissions.guard.spec.ts`
