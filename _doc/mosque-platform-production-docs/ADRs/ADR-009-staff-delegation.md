# ADR-009: Mosque Staff Delegation & Tiered Role Claim Governance

## Status
**Accepted**

## Date
2026-09-29

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In Release 1, all privileged platform actions (mosque verification, data moderation, and initial claim reviews) were handled centrally by global platform `admin` and `moderator` accounts. 

As the platform scales across Bangladesh into Release 2, centralized administration is an operational bottleneck:
1. Central platform admins cannot personally verify every local Imam, Muazzin, or Khadem across thousands of neighborhood mosques.
2. Mosques are sovereign local entities governed by their local Mutawalli (Mosque Administrator), Management Committee, and religious leaders (Khatibs, Imams).
3. Local mosque officials need authority to maintain accurate daily Jamaat schedules, broadcast official notices (e.g. Jumu'ah topics, Janaza prayers, Ramadan timings), and manage their facility status without waiting for central platform tickets.
4. However, unverified user takeover of mosque profiles poses severe security and community fraud risks (e.g. scam donation methods, defamatory announcements, unauthorized schedule changes).

## Decision

### 1. Tiered Decentralized Verification Model
We establish a two-tiered delegation hierarchy:
- **Tier 1 (Platform Admin Verification)**: Global platform Admins and Moderators verify claims for primary local mosque leadership roles (`MOSQUE_ADMIN` / Committee President).
- **Tier 2 (Local Mosque Delegation)**: Once a user is verified as `MOSQUE_ADMIN` or an authorized committee executive for a specific mosque, they gain autonomous administrative rights within that specific mosque to review, approve, and revoke local staff claims (`IMAM`, `MUAZZIN`, `KHATIB`, `KHADEM`, and `COMMITTEE_MEMBER`).
- **Platform Override**: Global platform Admins and Moderators retain permanent read, write, override, and revocation authority over all mosques and claims across the platform.

### 2. Granular Mosque-Scoped Permissions
Privileges are enforced strictly on the server by checking active, verified `MosqueStaff` records for the requesting user against the target `mosqueId`:
- **Mosque Admin / Committee President**: Full local governance (review and approve staff claims, edit mosque details, modify prayer times, publish announcements, update facility status).
- **Imam / Muazzin / Khatib**: Update daily Iqamah and Jamaat prayer schedules (`F-007`) and publish official announcements (`F-022`).
- **Khadem**: Update physical amenities and maintenance status (`F-021`).
- **Committee Member**: Publish announcements and manage physical amenities.
- **Ordinary Users**: Read-only public access; submit musalli attendance, crowdsourced suggestions, issue reports, or submit staff role claims.

### 3. Claim Concurrency & Anti-Abuse Invariants
- **Single-Pending Constraint**: A user cannot have multiple simultaneous `OPEN` or `UNDER_REVIEW` claims for the same mosque.
- **Multi-Role / Multi-Staff Support**: A mosque may have multiple staff members holding the same role type (e.g., Senior Imam and Junior Imam; multiple committee members).
- **Multi-Mosque Affiliation**: A user may hold staff roles at more than one mosque (e.g., visiting Khatib or multi-neighborhood volunteer).
- **Non-Evictive Approvals**: Approving a new staff claim does not automatically evict an existing role holder unless explicitly revoked by an authorized admin.

### 4. Immediate Revocation with Historical Attribution
- Revoking or removing a staff member immediately transitions their `isVerified` status to `false` and invalidates their mutation authorization for that mosque.
- Past announcements, prayer schedule changes, and audit entries authored by the revoked member remain intact and attributed to their user account for audit and historical integrity.

### 5. Zero-Extra-Infrastructure Architecture
- All state transitions, role claim reviews, staff roster upserts, and audit trail insertions are executed atomically within PostgreSQL `$transaction` blocks via Prisma.
- No external message brokers (BullMQ), caches (Redis), or WebSockets are introduced for this governance slice, keeping operational complexity minimal.

## Consequences

### Positive
- **Scalable Decentralized Operations**: Local mosque administrators can manage their staff roster and publish prayer times without platform admin bottleneck.
- **Security & Provenance**: Server-enforced mosque scoping prevents horizontal privilege escalation. All claim reviews and roster modifications produce immutable `AuditLog` rows.
- **High Data Freshness**: Daily prayer times and announcements can be updated instantly by actual Imams and Muazzins on the ground.

### Tradeoffs & Mitigations
- **Rogue Local Admin Risk**: A verified Mosque Admin could attempt to add malicious staff or post inappropriate announcements.
  - *Mitigation*: Global platform admins can revoke local Mosque Admins at any time. Any user can report inaccurate information or rogue announcements via `F-006`. All actions remain linked to the actor's verified account.

## References
- PRD Requirements: `_doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md#verified-mosque-roles`
- System Architecture: `_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md#4-modular-monolith-domain-structure`
- Authorization Baseline: `_doc/mosque-platform-production-docs/ADRs/ADR-003-server-side-actor-derivation-and-rbac.md`
- Production Standard: `_doc/mosque-platform-production-docs/08-PRODUCTION-ENGINEERING-STANDARD.md`
