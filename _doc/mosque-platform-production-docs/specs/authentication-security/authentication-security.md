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

## 5. Associated Tickets
- [TK-AUTH-01: Authentication Service & JWT Tokens](tickets/TK-AUTH-01-auth-service-and-jwt.md)
- [TK-AUTH-02: 2FA & Brute Force Lockout Defense](tickets/TK-AUTH-02-2fa-and-lockout-defense.md)
