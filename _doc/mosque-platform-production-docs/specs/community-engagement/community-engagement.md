---
id: F-012
name: Community Engagement & Mosque Operations
phase: 1
status: completed

depends_on:
  - F-001
  - F-002
  - F-004

blocks: []

parallel_with:
  - F-008

source:
  - 01-PRD-PRODUCTION.md#community-engagement
  - 06-IMPLEMENTATION-CHECKLIST.md#n-community-engagement
---

# Feature Specification: Community Engagement & Mosque Operations

## 1. Overview
The Community Engagement feature provides tools for local mosque communities: staff directories (Imam, Muazzin, Committee), staff role claims, official announcements, verified donation channels (bKash, Nagad, Bank), and user bookmarks.

## 2. Business Invariants
1. **Unverified Role Claims Staged**: When a user claims an Imam or Committee role, it enters `MosqueRoleClaim` in `OPEN` state until verified by a moderator.
2. **Verified Donation Methods**: Mosque donation accounts display verification badges to prevent fraudulent scam accounts.
3. **Unique Bookmarks**: A user cannot bookmark the same mosque multiple times (`@@unique([mosqueId, userId])`).

## 3. Data Models Reference
- `MosqueStaff`: `mosqueId`, `userId`, `role` (`IMAM`, `MUAZZIN`, `KHATIB`, `KHADEM`, `COMMITTEE_PRESIDENT`, etc.), `name`, `contactNumber`, `isVerified`.
- `MosqueRoleClaim`: `mosqueId`, `userId`, `role`, `evidence`, `status` (`OPEN`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`).
- `MosqueAnnouncement`: `mosqueId`, `title`, `content`, `isPinned`, `authorId`.
- `MosqueDonationMethod`: `mosqueId`, `methodType` (`BKASH`, `NAGAD`, `ROCKET`, `BANK_TRANSFER`), `accountNumber`, `isVerified`.
- `MosqueBookmark`: `mosqueId`, `userId`.

## 4. REST API Contracts
- `GET /api/v1/community/:mosqueId/staff` & `POST .../claim-role`
- `GET /api/v1/community/:mosqueId/announcements` & `POST .../announcements`
- `GET /api/v1/community/:mosqueId/donations`
- `POST /api/v1/community/:mosqueId/bookmark` & `DELETE .../bookmark`

## 5. Extracted Implementation Checklist
- [x] Staff schema and listing endpoint
- [x] Role claim submission and verification state machine
- [x] Mosque announcements with pinning support
- [x] Verified donation methods display (bKash, Nagad, Bank)
- [x] User bookmarking endpoints with idempotency
- [x] Community service unit test suite (`community.service.spec.ts`)
- [x] Frontend modals: `DonationModal.tsx`, `RoleClaimModal.tsx`, `AnnouncementModal.tsx`

---

## 6. Implementation Slices & Proof of Completion

### TK-COMM-01: Community Backend Service & Schemas
- **Status**: `[x] Completed` | **Priority**: Medium
- **Description**: Develop the backend models, services, and endpoints for mosque community features: staff rosters, role claims, announcements, donation methods, and bookmarks.
- **Acceptance Criteria**:
  - [x] Models `MosqueStaff`, `MosqueRoleClaim`, `MosqueAnnouncement`, `MosqueDonationMethod`, `MosqueBookmark`.
  - [x] Endpoints for querying and mutating community entities under `/api/v1/community` (and `/api/v1/mosques/:id/...` nested aliases).
  - [x] Role claims submit evidence string and enter `OPEN` status.
  - [x] Unit tests cover claims, bookmarks, and announcements (`community.service.spec.ts`).
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema.prisma`
  - Service: `backend-nest-prisma/src/features/community/community.service.ts`
  - Controller: `backend-nest-prisma/src/features/community/community.controller.ts`
  - Tests: `backend-nest-prisma/src/features/community/community.service.spec.ts`

### TK-COMM-02: Community Engagement Frontend Modals
- **Status**: `[x] Completed` | **Priority**: Medium
- **Description**: Build the interactive UI modals allowing users to view donation methods, claim mosque roles with evidence, and read/post mosque announcements.
- **Acceptance Criteria**:
  - [x] `DonationModal.tsx` displaying accounts (bKash, Nagad, Bank account) with copy-to-clipboard buttons.
  - [x] `RoleClaimModal.tsx` allowing authenticated musallis to claim Imam/Muazzin roles with description.
  - [x] `AnnouncementModal.tsx` rendering pinned announcements and dates.
- **Implementation Files**:
  - Components: `DonationModal.tsx`, `RoleClaimModal.tsx`, `AnnouncementModal.tsx`
  - Parent Modal: `frontend/src/components/MosqueDetailModal.tsx`
