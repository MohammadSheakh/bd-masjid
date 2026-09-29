---
id: F-002
name: Authentication & Credential Security
phase: 1
status: completed

depends_on:
  - F-001

blocks:
  - F-003
  - F-005
  - F-006
  - F-010

parallel_with:
  - F-004

source:
  - 01-PRD-PRODUCTION.md#accounts-and-identity
  - 04-SECURITY-RELIABILITY-OPERATIONS.md#authentication-security
  - 06-IMPLEMENTATION-CHECKLIST.md#c-authentication
---

# Feature Specification: Authentication & Credential Security

## 1. Overview
The Authentication & Credential Security feature provides identity lifecycle management, secure password hashing, JWT session/refresh tokens, brute-force lockout, two-factor authentication (TOTP), and credential sanitization.

## 2. Business Invariants
1. **Never Log Sensitive Credentials**: Passwords, tokens, OTPs, and recovery keys must be intercepted and redacted by logging middleware.
2. **Cryptographic Password Hashing**: Passwords stored exclusively as salted hashes (bcrypt/argon2). Plaintext passwords never persisted.
3. **Brute-Force Protection**: Accounts automatically locked after consecutive failed authentication attempts (`failedLoginAttempts`, `lockUntil`).
4. **Token Expiration & Refresh Rotation**: Access tokens expire after short intervals; refresh tokens are single-use or revocable.

## 3. REST API Contracts
- `POST /api/v1/auth/register` — User registration
- `POST /api/v1/auth/login` — Email/password login with lockout checking
- `POST /api/v1/auth/refresh-token` — Rotate refresh token
- `POST /api/v1/auth/logout` — Terminate session
- `POST /api/v1/auth/2fa/generate` & `verify` — TOTP setup & verification

## 4. Extracted Implementation Checklist
- [x] Registration and login endpoints
- [x] Bcrypt/argon2 password hashing with high work factor
- [x] JWT access and refresh token pair generation
- [x] Sliding-window rate limiting on login/auth routes
- [x] Account lockout on consecutive failed attempts
- [x] Two-factor authentication (TOTP) service
- [x] Credential logging prohibited via `LogSanitizer`
- [x] Auth unit and controller test suites (`auth.service.spec.ts`, `auth.controller.spec.ts`)

---

## 5. Implementation Slices & Proof of Completion

### TK-AUTH-01: Authentication Service & JWT Tokens
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Implement the core authentication lifecycle, including user registration, password hashing, token issuance, refresh token rotation, and rate-limited login endpoints.
- **Acceptance Criteria**:
  - [x] Passwords hashed using bcrypt/argon2 with salt.
  - [x] Endpoints `register`, `login`, `refresh-token`, `logout`.
  - [x] Sliding-window rate limit guard protects endpoints from dictionary attacks.
  - [x] Tests cover token issuance, incorrect password rejection, and refresh logic (`auth.service.spec.ts`).
- **Implementation Files**:
  - Service: `backend-nest-prisma/src/features/authentication/auth/auth.service.ts`
  - Controller: `backend-nest-prisma/src/features/authentication/auth/auth.controller.ts`
  - Tests: `backend-nest-prisma/src/features/authentication/auth/auth.service.spec.ts`

### TK-AUTH-02: 2FA & Brute Force Lockout Defense
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Provide account protection via consecutive failed attempt lockouts and TOTP two-factor authentication (2FA).
- **Acceptance Criteria**:
  - [x] Tracking `failedLoginAttempts` on `User` entity; locks account for 15m upon reaching limit.
  - [x] TOTP secret generation, QR uri export, and token verification (`TwoFactorService`).
  - [x] Recovery code hashing and validation.
  - [x] Unit tests cover lockout thresholds and TOTP validation (`two-factor.service.spec.ts`).
- **Implementation Files**:
  - Service: `backend-nest-prisma/src/features/authentication/two-factor/two-factor.service.ts`
  - Tests: `backend-nest-prisma/src/features/authentication/two-factor/two-factor.service.spec.ts`
