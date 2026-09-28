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

## 4. Associated Tickets
- [TK-RBAC-01: Permissions Guard & Server Actor Derivation](tickets/TK-RBAC-01-guards-and-derivation.md)
