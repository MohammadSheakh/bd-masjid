# ADR-003: Role-Based Access Control and Server-Side Actor Derivation

## Status
**Accepted**

## Date
2026-09-28

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
A public community platform faces multiple actor roles with differing privileges:
- **Guest / Public**: Browse mosques, search nearby, view prayer times, submit new unverified mosques, propose suggestions or report issues.
- **Authenticated User**: Bookmark mosques, mark attendance, submit staff role claims, manage profile, submit suggestions with user identity.
- **Moderator**: Review mosque submissions, inspect reports and suggestions, approve/reject community claims.
- **Admin**: Verify/reject mosques, manage users, modify platform settings, review audit logs.

In client-heavy single-page applications, a critical security vulnerability occurs when servers trust client-provided headers or body payloads like `userId`, `role`, or `isVerified`.

## Decision
1. **Server-Side Identity Derivation**:
   - The server never accepts `userId`, `actorId`, `role`, or `isDeleted` from request bodies or URL parameters for privileged operations.
   - Actor identity and role are derived exclusively on the server from the verified JWT payload (`AuthGuard` -> `CurrentUser` decorator).
2. **Default-Deny Role Architecture**:
   - Endpoints require authentication unless explicitly annotated with the `@Public()` decorator.
   - Privileged operations require explicit `@Roles(UserRole.admin, UserRole.moderator)` enforced by `PermissionsGuard`.
3. **Session & Token Management**:
   - Access tokens are short-lived (15-60m); refresh tokens are rotated on renewal.
   - Passwords hashed using bcrypt/argon2 with high work factor; brute-force protection locks accounts after consecutive failed attempts.
   - Multi-factor authentication (TOTP 2FA) supported for elevated accounts.

## Consequences

### Positive
- **Tamper-Proof Authorization**: Even if a malicious client tampers with local storage or headers, the backend cryptographic verification rejects unauthorized requests.
- **Consistent Audit Provenance**: All audit entries (`AuditLog`) accurately reflect the real authenticated actor ID rather than spoofed values.

### Tradeoffs & Mitigations
- **Stateless Token Invalidation**: Pure JWTs cannot be revoked instantly without a revocation list.
  - *Mitigation*: Short access token lifetimes coupled with database-backed refresh token rotation and revocation records.

## References
- System Architecture: `_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md`
- Security Baseline: `_doc/mosque-platform-production-docs/04-SECURITY-RELIABILITY-OPERATIONS.md`
