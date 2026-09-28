# TK-AUTH-02: 2FA & Brute Force Lockout Defense

## Spec
Parent Spec: [authentication-security.md](../authentication-security.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Provide account protection via consecutive failed attempt lockouts and TOTP two-factor authentication (2FA).

## Acceptance Criteria
- [x] Tracking `failedLoginAttempts` on `User` entity; locks account for 15m upon reaching limit.
- [x] TOTP secret generation, QR uri export, and token verification (`TwoFactorService`).
- [x] Recovery code hashing and validation.
- [x] Unit tests cover lockout thresholds and TOTP validation (`two-factor.service.spec.ts`).

## Implementation Files
- Service: `backend-nest-prisma/src/features/authentication/two-factor/two-factor.service.ts`
- Tests: `backend-nest-prisma/src/features/authentication/two-factor/two-factor.service.spec.ts`
