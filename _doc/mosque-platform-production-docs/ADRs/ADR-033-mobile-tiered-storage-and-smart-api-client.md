# ADR-033: Mobile Tiered Storage Architecture, Hardware Token Encryption, and Smart Localhost API Client

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
A mission-critical concern for enterprise mobile applications in the BD Masjid ecosystem is state partitioning, token security, and local development transport:
1. **Credential Security Invariant**: Plaintext storage (`AsyncStorage` or unencrypted key-value files) leaves JWT authentication tokens vulnerable to extraction on rooted Android or jailbroken iOS devices. Authentication tokens must be encrypted in hardware-backed KeyStore / Keychain (`expo-secure-store`).
2. **UI Micro-State & Followed Mosques**: Requiring asynchronous I/O with bridge roundtrips for trivial operations—such as checking if a mosque is bookmarked or reading the user's Auto-Silent duration—causes layout flashes and perceptible UI latency. Fast synchronous key-value storage is required.
3. **Local Development Transport & Android Emulators**: In Android emulators, `localhost:4000` points to the emulator's virtual loopback rather than the host workstation development machine running the NestJS server. Connecting requires routing to `http://10.0.2.2:4000/api/v1`. On physical devices or iOS simulators, `localhost:4000` or LAN IPs are used.
4. **Offline Resilience**: When internet connectivity drops or the NestJS backend is not yet started, the mobile client must never crash or present broken empty lists; it must seamlessly fall back to structured local fixtures.

---

## Decision

The platform adopts:
1. **Tiered Storage Architecture**:
   - **Tier 1 (Secure Store)**: Hardware-backed KeyStore/Keychain encryption for JWT access and refresh tokens. Auth tokens are strictly forbidden from being written to plain storage.
   - **Tier 2 (Synchronous KV Store)**: Zero-latency memory-mapped storage for followed mosque IDs, user UI preferences, and Auto-Silent configurations.
   - **Tier 3 (In-Memory Query Cache & Fixtures)**: Fast normalized query cache with automatic fallback to structured Bangladeshi mosque fixtures upon network errors.
2. **Smart Localhost Resolution API Client**:
   - Dynamic resolution: `process.env.EXPO_PUBLIC_API_URL` $\rightarrow$ `Platform.OS === 'android'` fallback (`http://10.0.2.2:4000/api/v1`) $\rightarrow$ iOS fallback (`http://localhost:4000/api/v1`).
   - Automatically attaches `Authorization: Bearer <token>` headers derived from the secure store.
   - Transparently handles server down-time with offline data fallback.

---

## Consequences

### Positive
- **Zero Token Leakage**: Conforms to enterprise OWASP mobile security baselines.
- **Instant Cold Starts**: Followed mosque IDs and Auto-Silent preferences load synchronously in $< 1$ ms.
- **Zero-Friction Dev Setup**: Works out of the box on Android emulators, iOS simulators, and offline environments.

### Negative / Trade-offs
- SecureStore writes are asynchronous and slightly slower than plain memory writes, which is acceptable for login/logout token transitions.
