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

## 6. Associated Tickets
- [TK-COMM-01: Community Backend Service & Schemas](tickets/TK-COMM-01-backend-service-and-schemas.md)
- [TK-COMM-02: Community Engagement Frontend Modals](tickets/TK-COMM-02-engagement-frontend-modals.md)
