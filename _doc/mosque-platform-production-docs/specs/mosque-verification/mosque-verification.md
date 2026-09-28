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

## 5. Associated Tickets
- [TK-VERF-01: Verification Service & State Machine](tickets/TK-VERF-01-service-and-state-machine.md)
- [TK-VERF-02: Admin Moderation Dashboard View](tickets/TK-VERF-02-admin-dashboard-view.md)
