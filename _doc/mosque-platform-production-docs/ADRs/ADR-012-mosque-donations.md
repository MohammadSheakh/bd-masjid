# ADR-012: Verified Mosque Donation Information & Fraud Prevention

## Status
**Accepted**

## Date
2026-09-30

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
Mosques in Bangladesh and global diaspora communities depend almost entirely on voluntary donations (Sadaqah, Jumu'ah collections, Zakat, construction and maintenance funds). However, digital donations carry severe financial risks:
1. **Financial Fraud & Impersonation**: Malicious actors or unauthorized individuals can easily post fake personal bKash/Nagad numbers or rogue bank accounts claiming to collect money on behalf of a mosque.
2. **Lack of Provenance**: Musallis looking to donate from home or abroad cannot distinguish between an officially authorized mosque fund and an unverified community post.
3. **Account Purpose Ambiguity**: Donors need clarity on whether an account accepts general mosque maintenance funds versus Zakat, Ramadan Iftar, or building expansion funds.

Per [01-PRD-PRODUCTION.md §14](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/_doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md#L315-L330):
- Ordinary users cannot directly publish canonical donation destinations.
- A verified, authorized role is strictly required.
- Changes must be audited.
- Verification provenance must be visibly presented to the public.
- Reports can flag suspected fraud without enabling malicious griefing.
- No integrated payment gateway or money transmission is operated by the platform; the platform serves as the authoritative, verified directory of official payment channels.

---

## Decision

### 1. Dedicated Feature Domain (`donations.module`)
In alignment with `02-SYSTEM-ARCHITECTURE.md` (Modular Monolith Domain Structure):
- Backend module: `backend-nest-prisma/src/features/donations/`
- Modular schema: `backend-nest-prisma/prisma/schema/donations.module/donations.prisma`
- REST routing: Canonical endpoints under `/api/v1/mosques/:id/donations` and `/api/v1/donations/:id`.

### 2. Two-Person Verification Governance (Separation of Duty)
To prevent rogue staff members from publishing personal bank/MFS accounts without oversight, the platform enforces a **Two-Person Verification Rule**:
- **Submitter**: Any verified `MUTAWALLI` or `COMMITTEE` member (`COMMITTEE_PRESIDENT`, `COMMITTEE_SECRETARY`, `COMMITTEE_MEMBER`) can draft and submit a donation account. The channel is created in status `PENDING_VERIFICATION` and is **not** displayed publicly.
- **Verifier**: The channel can only be activated (`VERIFIED`) by a verified `IMAM` or `MOSQUE_ADMIN` for that mosque.
- **Strict Anti-Collusion Invariant**: The verifier **cannot be the same user** who submitted the channel (`verifiedById !== createdById`).
- **Platform Override**: Global platform `admin`/`moderator` holds emergency approval and takedown rights.

### 3. Domain Model & Taxonomy
Each channel entity (`MosqueDonationChannel`) supports:
- **`channelType`**: `BKASH`, `NAGAD`, `ROCKET`, `UPAY`, `BANK_TRANSFER`.
- **`accountType`**: `MERCHANT`, `PERSONAL`, `AGENT`.
- **`purpose`**: `GENERAL_FUND`, `CONSTRUCTION_EXPANSION`, `ORPHAN_MADRASAH`, `RAMADAN_IFTAR`, `ZAKAT_SADAQAH`, `JANAZA_FUND`.
- **Account Details**: `accountNumber`, `accountTitle` (beneficiary name), `bankName`, `branchName`, `routingNumber`, `paymentInstructions`.
- **Optional Visual Artifact**: `qrCodeImageUrl` for scanned mobile app payments (stored via existing Cloudinary / S3 helper).
- **Status Lifecycle**: `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `FLAGGED`, `ARCHIVED`.

### 4. Anti-Griefing Fraud Reporting & Public Warning System
- Registered users can submit fraud or discrepancy reports (`ReportDonationDto`) citing reason, description, and optional evidence.
- **No Auto-Takedown Griefing**: To prevent bad-faith actors from sabotaging legitimate mosque fundraising drives on Jumu'ah or Ramadan, reports do not instantly delete or hide the channel.
- **Immediate Warning Badge**: When disputed, the channel displays a prominent `UNDER_INVESTIGATION` alert on the public profile, and notifications/audit events are dispatched to mosque leadership and platform moderators.
- Platform admins and mosque Mutawalli/Imam can transition the channel to `FLAGGED` (hiding it) or dismiss invalid reports.

### 5. Zero-Extra-Infrastructure Persistence & Atomic Auditing
- 100% PostgreSQL + Prisma implementation. Zero Redis, BullMQ, or WebSockets required.
- Fast indexed lookups using composite index `@@index([mosqueId, status])`.
- Every creation, approval, rejection, modification, and archive event executes inside an atomic PostgreSQL `$transaction` with an immutable `AuditLog` entry capturing previous state, new state, and actor ID.

---

## Consequences

### Positive
- **High Trust & Safety**: The two-person verification rule (Mutawalli submission + Imam/Admin approval) prevents rogue single-actor fraud.
- **Direct Financial Empowerment**: Enables mosques to collect donations legitimately without platform intermediary fees.
- **Clear Donor Transparency**: Donors see exactly who verified the account and when, alongside specific fund purposes (e.g. Zakat vs General).
- **Resilient Against Abuse**: The warning badge pattern protects mosques from competitor/griefer takedowns while keeping users informed.

### Negative / Trade-offs
- **Staff Coordination Overhead**: Requires at least two verified staff members (e.g., Committee submitter + Imam verifier) per mosque to publish donation channels.
- **Directory-Only Scope**: The platform does not track payment settlement or transaction success (users must send funds using their own banking apps).
