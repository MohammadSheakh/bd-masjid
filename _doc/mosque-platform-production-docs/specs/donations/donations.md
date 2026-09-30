---
id: F-030
name: Verified Mosque Donation Information & Fraud Prevention
phase: 3
status: planned

depends_on:
  - F-001
  - F-003
  - F-004
  - F-020

blocks: []

parallel_with: []

source:
  - 01-PRD-PRODUCTION.md#donation-information
  - 02-SYSTEM-ARCHITECTURE.md#modular-monolith-domain-structure
  - 03-DATA-API-CONTRACTS.md#donation-information
  - 04-SECURITY-RELIABILITY-OPERATIONS.md#fraud-prevention
  - 06-IMPLEMENTATION-CHECKLIST.md#d-authorization
  - 07-RELEASE-PLAN.md#release-3--donations-and-notifications
  - ADRs/ADR-012-mosque-donations.md
---

# Feature Specification: Verified Mosque Donation Information & Fraud Prevention (F-030)

## 1. Overview & Problem Statement

Mosques are community-funded institutions relying on voluntary donations (Sadaqah, Jumu'ah collections, Zakat, construction, and operational maintenance). In digital spaces, sharing financial accounts carries severe security risks:
- Fraudulent actors posting personal bKash/Nagad or bank accounts claiming to collect money on behalf of the mosque.
- General musallis being unable to distinguish official mosque funds from unauthorized or unverified solicitations.
- Donors lacking clarity on fund purposes (e.g. general mosque fund vs building construction vs orphan/madrasah support vs Ramadan Iftar).

Per [01-PRD-PRODUCTION.md §14](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/_doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md#L315-L330):
> "Donation information is a high-risk feature because incorrect payment information can cause real financial harm. Ordinary users cannot directly publish canonical donation destinations. A verified, authorized role is required. Changes are audited. Verification provenance is visible. Reports can flag suspected fraud."

**F-030** delivers a secure, production-grade **Verified Mosque Donation Channel Directory**:
- Enforces a decentralized **Two-Person Verification Rule**: A verified Mutawalli or Committee member submits the donation account, and an independent verified Imam or Mosque Admin approves it before public display.
- Supports comprehensive payment channels across Bangladesh (bKash, Nagad, Rocket, Upay, Bank Transfer) with specific fund designations.
- Provides public transparency cards with 1-click account copying, official QR codes, and clear verification provenance (`Verified by Imam [Name] on [Date]`).
- Includes an anti-griefing community fraud reporting mechanism that displays an "Under Investigation" alert without enabling malicious takedowns.
- Operates entirely on PostgreSQL with zero external queues or caches required.

---

## 2. Business Invariants & State Machine

### 2.1 Two-Person Verification Governance Matrix

| Role | Submit Draft Account (`PENDING`) | Approve / Verify Account (`VERIFIED`) | Reject / Archive Account | Submit Fraud Report | View Verified Channels |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Global Platform Admin** | ✅ Full | ✅ Full (Override) | ✅ Full | ✅ Full | ✅ Full |
| **MOSQUE_ADMIN** | ✅ Full | ✅ Full *(if not submitter)* | ✅ Full | ✅ Full | ✅ Full |
| **MUTAWALLI / COMMITTEE_PRESIDENT** | ✅ Full | ❌ Forbidden (403) | ✅ Full | ✅ Full | ✅ Full |
| **COMMITTEE_SECRETARY / MEMBER** | ✅ Full | ❌ Forbidden (403) | ❌ Forbidden (403) | ✅ Full | ✅ Full |
| **IMAM** | ❌ Forbidden (403) | ✅ Full *(if not submitter)* | ✅ Full | ✅ Full | ✅ Full |
| **KHATIB / MUAZZIN / KHADEM** | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) | ✅ Full | ✅ Full |
| **Registered User / Musalli** | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) | ✅ Full | ✅ Full |
| **Unauthenticated Guest** | ❌ Forbidden (401) | ❌ Forbidden (401) | ❌ Forbidden (401) | ❌ Forbidden (401) | ✅ Full |

### 2.2 Core Invariants

1. **Two-Person Verification Invariant (Separation of Duty)**:
   - A donation channel can only be drafted by verified mosque staff (`MUTAWALLI`, `COMMITTEE`).
   - The drafted channel enters status `PENDING_VERIFICATION` and is hidden from public view.
   - It can ONLY be verified (`VERIFIED`) by a verified `IMAM` or `MOSQUE_ADMIN` for that specific mosque.
   - **Anti-Collusion Rule**: The verifier **cannot be the user who submitted the channel** (`verifiedById !== createdById`). If a user attempts to approve their own submission, the server returns `403 Forbidden` (`CANNOT_APPROVE_OWN_SUBMISSION`).
2. **Channel Type & Formatting Bounds**:
   - `accountNumber` must match the format of the channel (e.g. 11 digits for BD mobile numbers, valid length for bank accounts).
   - `accountTitle` (beneficiary name) is mandatory to help donors verify the recipient before sending funds.
3. **Anti-Griefing Fraud Reporting**:
   - Registered users can report a donation channel using `POST /api/v1/donations/:id/report`.
   - Filing reports does NOT immediately delete or unpublish the channel (protecting legitimate mosque drives from sabotage).
   - Instead, the channel displays an `UNDER_INVESTIGATION` alert pill on the frontend, and the report is routed to mosque leadership and the platform moderation dashboard (`F-010`).
4. **Zero-Extra-Infra Persistence**:
   - All state transitions, provenance data, and fraud flags reside in PostgreSQL.
   - Public queries exclusively fetch `WHERE status = 'VERIFIED' AND mosqueId = :id`.
5. **Atomic Audit Logging**:
   - All submissions, approvals, rejections, edits, and status changes MUST write an immutable `AuditLog` entry in the same PostgreSQL transaction (`$transaction`).

---

## 3. Data Model Reference

### 3.1 Prisma Schema (`backend-nest-prisma/prisma/schema/donations.module/donations.prisma`)

```prisma
enum DonationChannelType {
  BKASH
  NAGAD
  ROCKET
  UPAY
  BANK_TRANSFER
}

enum DonationAccountType {
  MERCHANT
  PERSONAL
  AGENT
}

enum DonationPurpose {
  GENERAL_FUND
  CONSTRUCTION_EXPANSION
  ORPHAN_MADRASAH
  RAMADAN_IFTAR
  ZAKAT_SADAQAH
  JANAZA_FUND
}

enum DonationChannelStatus {
  PENDING_VERIFICATION
  VERIFIED
  REJECTED
  FLAGGED
  ARCHIVED
}

model MosqueDonationChannel {
  id                   String                 @id @default(cuid())
  mosqueId             String
  channelType          DonationChannelType
  accountType          DonationAccountType    @default(PERSONAL)
  purpose              DonationPurpose        @default(GENERAL_FUND)
  accountNumber        String                 @db.VarChar(50)
  accountTitle         String                 @db.VarChar(100)
  bankName             String?                @db.VarChar(100)
  branchName           String?                @db.VarChar(100)
  routingNumber        String?                @db.VarChar(50)
  paymentInstructions  String?                @db.Text
  qrCodeImageUrl       String?                @db.VarChar(255)
  status               DonationChannelStatus  @default(PENDING_VERIFICATION)
  disputeCount         Int                    @default(0)

  // Governance Provenance
  createdById          String
  verifiedById         String?
  verifiedAt           DateTime?
  rejectionReason      String?                @db.VarChar(255)

  createdAt            DateTime               @default(now())
  updatedAt            DateTime               @updatedAt

  mosque               Mosque                 @relation(fields: [mosqueId], references: [id], onDelete: Cascade)
  createdBy            User                   @relation("SubmittedDonations", fields: [createdById], references: [id])
  verifiedBy           User?                  @relation("VerifiedDonations", fields: [verifiedById], references: [id])
  reports              DonationReport[]

  @@index([mosqueId, status])
  @@index([channelType, status])
}

model DonationReport {
  id          String                 @id @default(cuid())
  channelId   String
  reportedById String
  reason      String                 @db.VarChar(100)
  description String                 @db.Text
  status      String                 @default("OPEN") // OPEN, REVIEWED, DISMISSED
  createdAt   DateTime               @default(now())

  channel     MosqueDonationChannel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  reportedBy  User                   @relation(fields: [reportedById], references: [id], onDelete: Cascade)

  @@index([channelId, status])
}
```

---

## 4. REST API Contracts

### 4.1 Endpoints

| Method | Path | Auth | Roles / Guard | Description |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/v1/mosques/:id/donations` | ✅ JWT | Mutawalli, Committee, Admin | Submit a new donation channel (creates `PENDING`) |
| `GET` | `/api/v1/mosques/:id/donations` | 🔓 Optional | Public (Staff see pending) | Get verified donation channels for a mosque |
| `GET` | `/api/v1/donations/:id` | 🔓 Optional | Public | Get single donation channel details & provenance |
| `PATCH` | `/api/v1/donations/:id/verify` | ✅ JWT | Imam, Mosque Admin *(must != submitter)* | Approve and verify a pending channel |
| `PATCH` | `/api/v1/donations/:id/reject` | ✅ JWT | Imam, Mosque Admin, Mutawalli | Reject or archive a donation channel |
| `PATCH` | `/api/v1/donations/:id` | ✅ JWT | Submitter, Mutawalli, Admin | Update channel details (re-triggers review if active) |
| `POST` | `/api/v1/donations/:id/report` | ✅ JWT | Authenticated User | Submit a community fraud or error report |

### 4.2 Request DTOs

#### `CreateDonationChannelDto`
```typescript
{
  channelType: 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY' | 'BANK_TRANSFER';
  accountType?: 'MERCHANT' | 'PERSONAL' | 'AGENT';
  purpose?: 'GENERAL_FUND' | 'CONSTRUCTION_EXPANSION' | 'ORPHAN_MADRASAH' | 'RAMADAN_IFTAR' | 'ZAKAT_SADAQAH' | 'JANAZA_FUND';
  accountNumber: string;        // e.g. "01711000000"
  accountTitle: string;         // e.g. "Baitul Mukarram Development Fund"
  bankName?: string;            // required if channelType === 'BANK_TRANSFER'
  branchName?: string;
  routingNumber?: string;
  paymentInstructions?: string;
  qrCodeImageUrl?: string;
}
```

#### `VerifyDonationChannelDto`
```typescript
{
  notes?: string;
}
```

#### `ReportDonationDto`
```typescript
{
  reason: 'INCORRECT_NUMBER' | 'SUSPECTED_FRAUD' | 'UNAUTHORIZED_ACCOUNT' | 'OTHER';
  description: string;
}
```

---

## 5. Extracted Implementation Checklist

- [ ] Modular Prisma schema (`donations.prisma`) and build script sync (`prisma:schema:build`)
- [ ] Backend feature module (`src/features/donations/`) with strict `class-validator` DTOs
- [ ] Two-person verification service enforcing `createdById !== verifiedById`
- [ ] Atomic audit logging for all channel state transitions
- [ ] Community fraud report submission and dispute counter increment
- [ ] Unit tests covering submission, two-person approval, self-approval blockage (403), and report logging
- [ ] Ferio frontend donation cards with 1-click copy, brand color badges, and purpose tags
- [ ] Verification provenance pill (`Verified by Imam [Name] on [Date]`)
- [ ] Staff submission and Imam approval console with pending queues
- [ ] Community fraud report modal

---

## 6. Implementation Slices & Proof Matrix

### TK-DON-01: Donations Backend Schema, Two-Person Verification Service, RBAC & APIs
- **Status**: `[ ] Pending` | **Priority**: Critical
- **Description**: Implement PostgreSQL/Prisma persistence, two-person verification service invariants, role governance, and REST endpoints.
- **Acceptance Criteria**:
  - [ ] `MosqueDonationChannel` and `DonationReport` tables migrated cleanly in PostgreSQL.
  - [ ] Draft channel created in `PENDING_VERIFICATION` status.
  - [ ] Only verified Imam or Mosque Admin can approve (`VERIFIED`), and cannot be the submitter.
  - [ ] Public endpoint exclusively lists `VERIFIED` channels unless caller is authorized staff.
  - [ ] Community report submission increments `disputeCount` and records `DonationReport`.
  - [ ] Comprehensive unit & integration tests passing with 100% assertion coverage.
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema/donations.module/donations.prisma`
  - Module: `backend-nest-prisma/src/features/donations/donations.module.ts`
  - Service: `backend-nest-prisma/src/features/donations/donations.service.ts`
  - Controller: `backend-nest-prisma/src/features/donations/donations.controller.ts`
  - Tests: `backend-nest-prisma/src/features/donations/donations.service.spec.ts`

### TK-DON-02: Ferio Frontend Donation Directory, 1-Click Copy Cards, Submit/Approve Modals & Fraud Reporting
- **Status**: `[ ] Pending` | **Priority**: High
- **Description**: Deliver accessible, responsive Ferio UI components for displaying official donation accounts, copying account numbers, reviewing verification provenance, and handling staff submission and approvals.
- **Acceptance Criteria**:
  - [ ] Mosque profile displays an interactive "Donations" tab with branded channel cards.
  - [ ] Channel cards display 1-click copy button with toast feedback and purpose badge.
  - [ ] Cards display explicit verification provenance pill (`Verified by Imam [Name] on [Date]`).
  - [ ] Disputed accounts display an "Under Investigation" warning banner.
  - [ ] Authorized staff can submit draft accounts via modal; Imams can review and approve pending drafts.
  - [ ] Zero TypeScript or build errors in Next.js (`pnpm build`).
- **Implementation Files**:
  - Component: `frontend/src/components/donations/DonationChannelCard.tsx`
  - Component: `frontend/src/components/donations/AddDonationModal.tsx`
  - Component: `frontend/src/components/donations/PendingDonationApprovalList.tsx`
  - Component: `frontend/src/components/donations/ReportDonationModal.tsx`
  - API Client: `frontend/src/lib/api/donations.ts`
