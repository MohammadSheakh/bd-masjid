# ADR-054: Mobile User Authentication, Contributor Identity & Secure Session Management

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-003, ADR-004, and ADR-029, the Mosque Platform established strict authentication and role-based authorization standards (`User`, `Role`, `UserPayload`) with JSON Web Tokens (JWT) and dual-token rotation (`accessToken`, `refreshToken`).

In the mobile client (`mobile-app-expo`), worshippers have enjoyed unrestricted guest access to nearby mosques, Jammat countdowns, the Qibla compass, facilities, and notifications. However, for trusted operations:
1. **Contributor Attribution & Ownership**: Mosques created via pin-drop (`POST /mosques`), prayer schedule updates (`PUT /mosques/:id/prayer-schedule`), and community suggestions (`POST /mosques/:id/suggestions`) should associate with verified user identities where available.
2. **Personalized Profile & Cross-Device Persistence**: Following mosques, custom collection tags, and verified roles (Imam, Mutawalli, Contributor) require user session continuity.
3. **Secure Hardware Credential Boundary**: Access and refresh tokens must never be logged or stored in unencrypted plaintext on low-end Android/iOS devices.

---

## Decision

### 1. Domain Types & Session Models (`types/auth.ts`)
We introduce mobile domain types mirroring `backend-nest-prisma/src/features/authentication/auth/`:
- `UserProfile`: `id`, `name`, `email`, `role`, `phoneNumber`, `isEmailVerified`, `createdAt`.
- `AuthSession`: `user: UserProfile | null`, `isAuthenticated: boolean`.
- `LoginPayload`: `email`, `password`.
- `RegisterPayload`: `name`, `email`, `password`, `phoneNumber?`.

### 2. Client Transport & Secure Token Injection (`apiClient.ts`)
- In `ApiClient`, we add:
  - `loginUser(payload: LoginPayload): Promise<{ user: UserProfile; accessToken: string; refreshToken: string }>`
  - `registerUser(payload: RegisterPayload): Promise<{ user: UserProfile; accessToken: string; refreshToken: string }>`
  - `fetchCurrentUserSession(): Promise<UserProfile | null>`
  - `logoutUser(): Promise<void>`
- Automatic token injection: Outgoing requests dynamically append `Authorization: Bearer <token>` fetched from `SecureTokenStorage`.
- Token persistence: Upon login or registration, tokens are saved via `SecureTokenStorage.setTokens()`. Upon logout, tokens are cleared.

### 3. Fast Synchronous Auth Service (`authService.ts`)
- In-memory synchronous user profile caching (`< 1ms` access) so UI components render immediately without async delays.
- Pub/Sub subscription pattern (`subscribeAuth(listener)`) dispatching state changes to navbar, modals, and detail sheets.
- Hydrates existing session on app startup via `SecureTokenStorage.getAccessToken()`.

### 4. Ferio `AuthSessionModal` (`AuthSessionModal.tsx`)
- High-contrast modal sheet following Ferio tokens:
  - **Guest Mode Tabs**: Switch between `Sign In` and `Create Account`.
  - **Authenticated Profile Card**: Displays user avatar initial, full name, email, verified badge (`✓ Verified Musalli / Contributor`), and clean `Sign Out` button.
  - **Guest Preservation**: Explicit banner noting that an account is optional for viewing prayer times, ensuring non-blocking usage.

### 5. Top Navbar Profile Trigger (`App.tsx`)
- In `topNavbarActions`, replace anonymous avatar with responsive profile pill:
  - Guest: `👤 Log In` (neutral canvas pill)
  - Authenticated: `👤 John` with emerald dot indicator (`#059669`).

---

## Consequences

### Positive
- **Security Baseline**: Hardware KeyStore / Keychain encryption via `expo-secure-store` TurboModule with zero plaintext leakage.
- **Progressive Disclosure**: Anonymous guest musallis are never blocked from prayer times or offline schedules.
- **Traceability**: All subsequent contributor submissions carry authenticated provenance.

### Verification Criteria
- `npx tsc --noEmit` compiles with 0 errors.
- `npm run benchmark` cold launch $< 1500$ ms, heap $< 65$ MB, 60 FPS on low-end hardware.
