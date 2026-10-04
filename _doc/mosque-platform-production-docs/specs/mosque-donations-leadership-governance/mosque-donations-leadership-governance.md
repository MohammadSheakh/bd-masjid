---
id: F-039
name: Mosque Donation Channel Leadership Verification & Creator Provenance Governance
phase: 3
status: in-progress

depends_on:
  - F-001
  - F-003
  - F-004
  - F-020
  - F-030

blocks: []

parallel_with:
  - F-038

source:
  - 01-PRD-PRODUCTION.md#verified-mosque-donations
  - 02-SYSTEM-ARCHITECTURE.md#authorization-model
  - 03-DATA-API-CONTRACTS.md#donations-endpoints
  - 06-IMPLEMENTATION-CHECKLIST.md#f-verified-donations
  - ADRs/ADR-028-mosque-donation-channel-leadership-verification-and-creator-provenance.md
---

# Feature Specification: Mosque Donation Channel Leadership Verification & Creator Provenance Governance

## 1. Overview
Revises the donation channel lifecycle to eliminate the central platform admin verification bottleneck. Empowers verified mosque leadership officers (Mutawalli, President, Vice President, General Secretary) to immediately deploy active, verified donation channels. Enforces public creator transparency (displaying the creator's name, mosque position, and photo) and a multi-signatory leadership verification status showing distinct green checkmarks for attested roles (President, General Secretary, Vice President, Mutawalli) while displaying non-attested positions in a muted/dull state.

---

## 2. Business Invariants
1. **Executive Creation Authority**: Only verified mosque officers holding `MUTAWALLI`, `COMMITTEE_PRESIDENT`, `COMMITTEE_VICE_PRESIDENT`, `COMMITTEE_SECRETARY`, or `MOSQUE_ADMIN` can create donation channels for a mosque.
2. **Immediate Sovereign Verification**: Channels created by these verified leaders do not require central platform admin intervention; they are created in `VERIFIED` status.
3. **Creator Provenance Binding**: When creating a channel, the officer's `name`, `role` (position), and `imageUrl` are persisted directly onto the channel record for immutable public presentation.
4. **Multi-Signatory Verification Matrix**:
   - `verifiedRoles` (string array) records which executive roles have attested the channel.
   - Upon creation, the creator's role is automatically added to `verifiedRoles`.
   - On the public UI, the creator's role displays an active green tick mark (`✓ President`).
   - Unverified positions (e.g., General Secretary, Vice President) display in a dull/muted state until attested by an officer of that role.
5. **Committee Multiplicity**: The platform explicitly supports multiple Vice Presidents (`COMMITTEE_VICE_PRESIDENT`) and multiple Committee Members (`COMMITTEE_MEMBER`).

---

## 3. Data Model Reference
Prisma additions to `MosqueDonationChannel` in `prisma/schema/donations.module/donations.prisma`:
```prisma
// Extended fields on MosqueDonationChannel:
// creatorName          String?                     @db.VarChar(100)
// creatorRole          String?                     @db.VarChar(50)
// creatorImageUrl      String?                     @db.VarChar(255)
// verifiedRoles        String[]                    @default([])
// roleAttestations     Json?                       @default("[]")
```

---

## 4. REST API Contracts
- `POST /api/v1/mosques/:id/donations`
  - Restricts creators to verified `[MUTAWALLI, COMMITTEE_PRESIDENT, COMMITTEE_VICE_PRESIDENT, COMMITTEE_SECRETARY, MOSQUE_ADMIN]`.
  - Automatically captures creator profile and initial role attestation.
- `GET /api/v1/mosques/:id/donations`
  - Returns donation channels with creator provenance and `verifiedRoles`.
- `PATCH /api/v1/donations/:id/verify` (or `POST /api/v1/donations/:id/attest`)
  - Allows an officer from another eligible leadership role to add their role to `verifiedRoles`.

---

## 5. Extracted Implementation Checklist
- [ ] Prisma schema migration with provenance and verification fields
- [ ] Backend DonationsService permission checks, provenance capture, and role attestation logic
- [ ] Backend controller unit tests and verification
- [ ] Frontend TypeScript types update (`types/donation.ts` and `types/mosque.ts`)
- [ ] Frontend `DonationChannelCard` with creator portrait, position badge, and multi-role green/dull tick marks
- [ ] Frontend `AddDonationModal` & `DonationModal` leadership guidance and committee member taxonomy

---

## 6. Implementation Slices & Proof of Completion

### TK-DON-03: Relational Schema & Migration for Provenance and Role Verification
- **Status**: `[ ] Pending` | **Priority**: Critical
- **Description**: Add `creatorName`, `creatorRole`, `creatorImageUrl`, `verifiedRoles`, and `roleAttestations` to `MosqueDonationChannel` model in Prisma.
- **Acceptance Criteria**:
  - [ ] Schema syncs and migration applies cleanly to PostgreSQL.
  - [ ] Default values ensure backward compatibility with existing channels.
- **Implementation Files**:
  - `backend-nest-prisma/prisma/schema/donations.module/donations.prisma`
  - `backend-nest-prisma/prisma/migrations/`

### TK-DON-04: Backend Donations Service & Multi-Role Attestation Logic
- **Status**: `[ ] Pending` | **Priority**: High
- **Description**: Guard channel creation to Mutawalli, President, Vice President, and Secretary; auto-verify upon creation with creator provenance and support subsequent role attestations.
- **Acceptance Criteria**:
  - [ ] Service enforces role checks and rejects unauthorized roles (e.g. Khadem or regular user).
  - [ ] Service attaches creator name, role, photo, and initial role verification.
  - [ ] Unit tests pass with 100% coverage.
- **Implementation Files**:
  - `backend-nest-prisma/src/features/donations/donations.service.ts`
  - `backend-nest-prisma/src/features/donations/donations.controller.ts`
  - `backend-nest-prisma/src/features/donations/test/donations.service.spec.ts`
  - `backend-nest-prisma/src/features/donations/test/donations.controller.spec.ts`

### TK-DON-05: Ferio Frontend Creator Provenance & Leadership Multi-Signatory Badges
- **Status**: `[ ] Pending` | **Priority**: High
- **Description**: Update `DonationChannelCard` to display creator identity, mosque position, and multi-role verification checkmarks (green vs dull).
- **Acceptance Criteria**:
  - [ ] Creator name, position, and avatar image render clearly on each donation card.
  - [ ] President, General Secretary, Vice President, and Mutawalli show green tick if verified, dull if not.
  - [ ] Frontend builds with 0 errors.
- **Implementation Files**:
  - `frontend/src/types/donation.ts`
  - `frontend/src/types/mosque.ts`
  - `frontend/src/components/donations/DonationChannelCard.tsx`
  - `frontend/src/components/donations/AddDonationModal.tsx`
  - `frontend/src/components/DonationModal.tsx`
