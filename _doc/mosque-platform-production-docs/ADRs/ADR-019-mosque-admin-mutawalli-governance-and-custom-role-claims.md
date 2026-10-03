# ADR-019: Mosque Admin & Mutawalli Dual Super-Role Governance, Custom Roles, and Identity Verification Claims

## Status
**Accepted**

## Date
2026-10-01

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In Release 2 (`F-020`, `ADR-009`), the platform introduced decentralized mosque staff delegation. However, several critical real-world governance and onboarding limitations were identified:
1. **Conflation of Mosque Administrator and Mutawalli**:
   - The system previously represented the mosque super-role under a single `MOSQUE_ADMIN` moniker, which in the UI was labeled `"Mosque Administrator (Mutawalli)"`.
   - In Bangladeshi mosque administration, a **Mutawalli** (traditional waqf trustee / hereditary or board-appointed custodian) and a **Mosque Administrator** (modern administrative / management head) may be distinct individuals, or an institution may recognize both offices with equivalent executive prerogatives.
   - The platform needs explicit separation between `MOSQUE_ADMIN` and `MUTAWALLI`, while granting **both roles super-administrative permissions** over the mosque's roster, announcements, facilities, donations, and settings.
2. **Lack of Custom Role Support**:
   - Mosques frequently employ specialized or localized roles (e.g. *Assistant Imam*, *Treasurer / Cashier*, *Security In-Charge*, *Media & IT Coordinator*, *Senior Khadem*).
   - Constraining claims solely to fixed enums prevented legitimate staff from registering their exact designations.
3. **Incomplete Claim Verification Profile**:
   - The previous claim modal only captured `role`, `evidence`, and optional `documentUrl`.
   - Critical identity credentials were missing: applicant's explicit **full name**, verified **phone number**, **service starting date**, and **personal portrait/image upload**.
   - Reviewing administrators had to rely on ambiguous narrative evidence without direct photographic attribution or verified contact credentials.

---

## Decision

### 1. Dual Super-Permission Architecture: `MOSQUE_ADMIN` & `MUTAWALLI`
We introduce `MUTAWALLI` as a first-class role in `MosqueStaffRole` alongside `MOSQUE_ADMIN`:
- Both `MOSQUE_ADMIN` and `MUTAWALLI` possess equivalent **executive super-permissions** scoped to their verified mosque:
  - Approve or reject claims for local staff (`IMAM`, `MUAZZIN`, `KHATIB`, `KHADEM`, `COMMITTEE_MEMBER`, `CUSTOM`).
  - Add or remove local mosque staff from the directory.
  - Broadcast high-priority `EMERGENCY_ALERT` announcements and edit/remove any announcement.
  - Modify official mosque facilities and amenities.
  - Submit and verify official mosque donation accounts (satisfying the two-person verification rule).
- **Lateral Takeover Prevention Invariant**:
  - Neither a local `MOSQUE_ADMIN` nor a local `MUTAWALLI` can review, approve, or revoke another `MOSQUE_ADMIN` or `MUTAWALLI`.
  - Claims for `MOSQUE_ADMIN` and `MUTAWALLI` require review and verification by global platform `admin` or `moderator` accounts.

### 2. Custom Role (`CUSTOM`) Support with Standardized Title
- We add `CUSTOM` to `MosqueStaffRole`.
- Both `MosqueRoleClaim` and `MosqueStaff` entities support an optional `customRoleTitle: String?` field.
- When `role === CUSTOM`, `customRoleTitle` is **mandatory** (2–60 characters) across API validation and UI inputs.
- The UI renders custom titles in staff rosters, management queues, and badges (e.g., `"Treasurer (Custom)"`).

### 3. Enriched Identity Verification Claim Model
We upgrade `MosqueRoleClaim` to capture complete applicant provenance:
- `name: String` — Applicant's official full name (defaults to authenticated user's name).
- `phoneNumber: String` — Direct contact phone number (validated format).
- `startDate: DateTime?` — Date the applicant began their service at this mosque.
- `imageUrl: String?` — Photo / portrait image of the person (uploaded or verified URL).
- `customRoleTitle: String?` — Required when claiming `CUSTOM`.
- `evidence: String` — Detailed narrative & appointment references (minimum 15 characters).
- `documentUrl: String?` — Optional document scan, certificate, or appointment letter URL.

Upon claim approval by an authorized administrator:
- All identity attributes (`name`, `phoneNumber` as `contactNumber`, `startDate`, `imageUrl`, `role`, `customRoleTitle`) are atomically transferred into the verified `MosqueStaff` record within a PostgreSQL `$transaction`.

### 4. Direct Photographic Asset Upload Pipeline
- The frontend claim modal incorporates direct drag-and-drop / file selection image upload with real-time avatar preview and client-side optimization.
- The platform supports both backend multipart upload (`POST /api/v1/community/upload-image`) and secure URL references, ensuring resilience across local and production deployment environments without third-party vendor lock-in.

---

## Consequences

### Positive
- **Authentic Local Governance**: Fully matches real Bangladeshi mosque structures by acknowledging both Mutawalli trustees and Mosque Administrators with super-user authority.
- **Flexibility**: Custom roles accommodate the diverse staffing arrangements of urban and rural mosques.
- **High Trust & Safety**: Applicant photos, verified phone numbers, and starting dates eliminate phantom/anonymous claims and provide moderators with clear proof of identity.
- **Seamless Roster Transfer**: Approved claims instantly populate rich staff profiles with photos and tenure dates in the public mosque directory.

### Tradeoffs & Mitigations
- **Storage of Person Images**: Person images increase asset storage requirements.
  - *Mitigation*: Client-side image validation enforces file size limits (<= 5MB) and permitted image types (JPEG, PNG, WebP), stored securely with audit trail linkage.

---

## References
- `_doc/mosque-platform-production-docs/specs/mosque-admin-mutawalli-governance/mosque-admin-mutawalli-governance.md`
- `_doc/mosque-platform-production-docs/ADRs/ADR-009-staff-delegation.md`
- `_doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md#verified-mosque-roles`
