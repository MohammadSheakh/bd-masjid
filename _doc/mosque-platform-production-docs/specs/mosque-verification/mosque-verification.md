---
id: F-010
name: Mosque Verification & Admin Moderation
phase: 1
status: completed

depends_on:
  - F-001
  - F-002
  - F-003
  - F-004
  - F-006

blocks: []

parallel_with: []

source:
  - 01-PRD-PRODUCTION.md#verification-and-moderation
  - 03-DATA-API-CONTRACTS.md#moderation-contracts
  - 06-IMPLEMENTATION-CHECKLIST.md#l-admin-verification-and-moderation
---

# Feature Specification: Mosque Verification & Admin Moderation

## 1. Overview
The Mosque Verification & Moderation feature governs the formal lifecycle of mosques submitted by the public, allowing authorized administrators and moderators to review, approve, reject, and inspect evidence.

## 2. Business Invariants
1. **Protected State Transitions**: Status transitions must follow defined rules:
   - `UNVERIFIED` / `PENDING_VERIFICATION` -> `VERIFIED` or `REJECTED`.
   - `VERIFIED` mosques cannot be casually deleted; transition to `REJECTED` or `TEMPORARILY_CLOSED` requires reason notes.
2. **Strict Authorization**: Only authenticated users with `admin` or `moderator` roles may trigger verification transitions.
3. **Audit Trail Guarantee**: Every approval or rejection must write an immutable audit log with `actorId`, `previousValue`, and `newValue`.
4. **Idempotent Actions**: Approving an already verified mosque returns HTTP 200 without creating phantom audit records.

## 3. REST API Contracts
- `GET /api/v1/mosque-verification/pending` — List pending mosques (moderator/admin)
- `POST /api/v1/mosque-verification/:mosqueId/verify` — Approve mosque (moderator/admin)
- `POST /api/v1/mosque-verification/:mosqueId/reject` — Reject mosque with reason (moderator/admin)

## 4. Extracted Implementation Checklist
- [x] Pending verification query endpoint with pagination
- [x] Verify mosque mutation endpoint
- [x] Reject mosque mutation endpoint
- [x] Server-side role guard enforcing Admin/Moderator access
- [x] Status transition validation and error handling
- [x] Idempotent behavior on repeated verification calls
- [x] Audit log creation on all verification changes
- [x] Admin Dashboard UI (`/admin`) for pending verifications and reports

---

## 5. Implementation Slices & Proof of Completion

### TK-VERF-01: Verification Service & State Machine
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Implement the business logic and API endpoints for moderating and verifying submitted mosques, including role enforcement, transition validation, and audit recording.
- **Acceptance Criteria**:
  - [x] Endpoints `GET /pending`, `POST /:mosqueId/verify`, `POST /:mosqueId/reject`.
  - [x] Restrict access to `admin` and `moderator` roles using `PermissionsGuard`.
  - [x] Transition updates `verificationStatus`, `verifiedById`, `verifiedAt`, and `verificationNotes`.
  - [x] Creates an audit log entry in `AuditLog` table.
  - [x] Idempotent handling if already verified or rejected.
- **Implementation Files**:
  - Controller: `backend-nest-prisma/src/features/mosque-verification/mosque-verification.controller.ts`
  - Service: `backend-nest-prisma/src/features/mosque-verification/mosque-verification.service.ts`
  - Tests: `backend-nest-prisma/src/features/mosque-verification/mosque-verification.service.spec.ts`

### TK-VERF-02: Admin Moderation Dashboard View
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Build the Next.js admin interface (`/admin`) presenting pending mosque submissions, verification actions, suggestion reviews, and system metrics.
- **Acceptance Criteria**:
  - [x] Admin dashboard page at `app/admin/page.tsx`.
  - [x] Pending mosques queue table with name, location coordinates, creator, and action buttons.
  - [x] "Verify" action triggers approval and updates list immediately.
  - [x] "Reject" action opens prompt for rejection reasoning.
  - [x] Reports and suggestions tab for moderating community reports.
- **Implementation Files**:
  - Frontend Admin Page: `frontend/src/app/admin/page.tsx`
