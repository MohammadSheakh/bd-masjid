# TK-AUTH-01: Authentication Service & JWT Tokens

## Spec
Parent Spec: [authentication-security.md](../authentication-security.md)

## Status
**Completed** `[x]`

## Priority
Critical

---

## Description
Implement the core authentication lifecycle, including user registration, password hashing, token issuance, refresh token rotation, and rate-limited login endpoints.

## Acceptance Criteria
- [x] Passwords hashed using bcrypt/argon2 with salt.
- [x] Endpoints `register`, `login`, `refresh-token`, `logout`.
- [x] Sliding-window rate limit guard protects endpoints from dictionary attacks.
- [x] Tests cover token issuance, incorrect password rejection, and refresh logic (`auth.service.spec.ts`).

## Implementation Files
- Service: `backend-nest-prisma/src/features/authentication/auth/auth.service.ts`
- Controller: `backend-nest-prisma/src/features/authentication/auth/auth.controller.ts`
- Tests: `backend-nest-prisma/src/features/authentication/auth/auth.service.spec.ts`
