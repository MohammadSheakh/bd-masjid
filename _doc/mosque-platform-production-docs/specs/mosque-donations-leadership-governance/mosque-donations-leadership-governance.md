---
id: F-039
name: Mosque Donation Channel Leadership Verification & Creator Provenance Governance
phase: 3
status: completed

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
  - 03-DATA-API-CONTRACTS.md#donations-subdomain
  - 06-IMPLEMENTATION-CHECKLIST.md#f-verified-donations
  - ADRs/ADR-028-mosque-donation-channel-leadership-verification-and-creator-provenance.md
---

# Feature Specification: F-039 Mosque Donation Channel Leadership Verification & Creator Provenance Governance

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
model MosqueDonationChannel {
  id                   String                      @id @default(cuid())
  mosqueId             String
  channelType          DonationChannelType
  accountType          DonationChannelAccountType  @default(PERSONAL)
  purpose              DonationPurpose             @default(GENERAL_FUND)
  accountNumber        String                      @db.VarChar(50)
  accountTitle         String                      @db.VarChar(100)
  bankName             String?                     @db.VarChar(100)
  branchName           String?                     @db.VarChar(100)
  routingNumber        String?                     @db.VarChar(50)
  paymentInstructions  String?                     @db.VarChar(500)
  qrCodeImageUrl       String?                     @db.VarChar(255)
  status               DonationChannelStatus       @default(VERIFIED)
  disputeCount         Int                         @default(0)

  // Governance Provenance
  createdById          String
  creatorName          String?                     @db.VarChar(100)
  creatorRole          String?                     @db.VarChar(50)
  creatorImageUrl      String?                     @db.VarChar(255)
  verifiedRoles        String[]                    @default([])
  roleAttestations     Json?                       @default("[]")
  verifiedById         String?
  verifiedAt           DateTime?
  rejectionReason      String?                     @db.VarChar(255)

  createdAt            DateTime                    @default(now())
  updatedAt            DateTime                    @updatedAt
}
```

---

## 4. REST API Contracts
- `POST /api/v1/mosques/:id/donations`
  - Restricts creators to verified `[MUTAWALLI, COMMITTEE_PRESIDENT, COMMITTEE_VICE_PRESIDENT, COMMITTEE_SECRETARY, MOSQUE_ADMIN]`.
  - Automatically captures creator profile and initial role attestation.
- `GET /api/v1/mosques/:id/donations`
  - Returns donation channels with creator provenance and `verifiedRoles`.
- `POST /api/v1/donations/:id/attest`
  - Allows an officer from another eligible leadership role to add their role to `verifiedRoles`.

---

## 5. Implementation Slices & Proof of Completion

### TK-DON-03: Relational Schema & Migration for Provenance and Role Verification
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Add `creatorName`, `creatorRole`, `creatorImageUrl`, `verifiedRoles`, and `roleAttestations` to `MosqueDonationChannel` model in Prisma.
- **Acceptance Criteria**:
  - [x] Schema syncs and migration applies cleanly to PostgreSQL.
  - [x] Default values ensure backward compatibility with existing channels.
- **Proof**: Commit `2e5b6db` with applied migration `20261004163000_donation_channel_creator_provenance_and_role_attestations`.

### TK-DON-04: Backend Donations Service & Multi-Role Attestation Logic
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Guard channel creation to Mutawalli, President, Vice President, and Secretary; auto-verify upon creation with creator provenance and support subsequent role attestations.
- **Acceptance Criteria**:
  - [x] Service enforces role checks and rejects unauthorized roles (e.g. Khadem or regular user).
  - [x] Service attaches creator name, role, photo, and initial role verification.
  - [x] Unit tests pass with 100% coverage.
- **Proof**: Commit `5fd936a`. All 21 Jest unit tests passed in `src/features/donations/`.

### TK-DON-05: Ferio Frontend Creator Provenance & Leadership Multi-Signatory Badges
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Update `DonationChannelCard` to display creator identity, mosque position, and multi-role verification checkmarks (green vs dull).
- **Acceptance Criteria**:
  - [x] Creator name, position, and avatar image render clearly on each donation card.
  - [x] President, General Secretary, Vice President, and Mutawalli show green tick if verified, dull if not.
  - [x] Frontend builds with 0 errors.
- **Proof**: Commit `ec4f5cd`. Next.js build compiled with 0 errors.
