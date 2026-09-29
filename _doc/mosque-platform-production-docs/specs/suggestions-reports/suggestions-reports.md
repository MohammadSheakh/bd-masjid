---
id: F-006
name: Crowdsourced Suggestions & Problem Reports
phase: 1
status: completed

depends_on:
  - F-001
  - F-004

blocks:
  - F-010

parallel_with:
  - F-008

source:
  - 01-PRD-PRODUCTION.md#suggestions-and-reporting
  - 03-DATA-API-CONTRACTS.md#suggestion-contracts
  - 06-IMPLEMENTATION-CHECKLIST.md#k-suggestions-and-reports
---

# Feature Specification: Crowdsourced Suggestions & Problem Reports

## 1. Overview
The Suggestions & Reports feature empowers users to suggest prayer time updates or report inaccurate information (e.g. incorrect pin, duplicate entry, closed mosque) without directly overwriting canonical records.

## 2. Business Invariants
1. **Never Overwrite Canonical Data Directly**: Community suggestions and reports are staged in moderation tables (`MosqueSuggestion`, `MosqueReport`).
2. **Explicit Moderation Workflow**: State machine follows `OPEN` -> `UNDER_REVIEW` -> `RESOLVED` / `REJECTED`.
3. **Payload Sanitization**: Text descriptions are strictly bounded and escaped against XSS.
4. **Abuse & Spam Defense**: Endpoints are throttled with a sliding window rate limiter.
5. **Traceable Resolution**: When a moderator resolves an item, `reviewedById`, `reviewedAt`, and `resolutionNotes` are recorded.

## 3. Data Models Reference
- `MosqueSuggestion`: `mosqueId`, `userId` (optional), `suggestedTimes` (Json), `description`, `status`, `reviewedById`, `resolutionNotes`.
- `MosqueReport`: `mosqueId`, `userId` (optional), `type` (`PRAYER_TIME`, `LOCATION`, `CLOSED_MOSQUE`, `DUPLICATE`, `CONTACT_INFO`, `STAFF_INFO`, `DONATION_INFO`, `OTHER`), `description`, `contactEmail`, `status`, `reviewedById`.

## 4. REST API Contracts
- `POST /api/v1/suggestions` — Submit prayer time or facility correction
- `POST /api/v1/suggestions/reports` — Report inaccurate info or closure
- `GET /api/v1/suggestions` — Moderator list of suggestions
- `PATCH /api/v1/suggestions/:id/status` — Review and resolve/reject suggestion

## 5. Extracted Implementation Checklist
- [x] Suggestion endpoint with payload validation
- [x] Issue reporting endpoint with categorization
- [x] Anonymous submission allowed with rate-limiting
- [x] Sliding window rate limit applied on public endpoints
- [x] Payload length validation on text fields
- [x] Moderation states (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`)
- [x] Canonical data protected from direct overwrite
- [x] Admin moderation API for status resolution
- [x] Frontend `SuggestionModal.tsx` and `ReportModal.tsx`
- [ ] Automated CAPTCHA trigger on elevated rate-limit triggers

---

## 6. Implementation Slices & Proof of Completion

### TK-SUGG-01: Suggestions & Reports Persistence API
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Build the backend data models, DTOs, and endpoints for accepting crowdsourced suggestions and issue reports with sliding-window rate limiting.
- **Acceptance Criteria**:
  - [x] Prisma models `MosqueSuggestion` and `MosqueReport` defined with relational links to `Mosque` and `User`.
  - [x] Endpoints `POST /api/v1/mosques/:id/suggestions` and `POST /api/v1/mosques/:id/reports` accepting validated DTOs.
  - [x] Rate limiting applied to prevent submission flooding.
  - [x] Moderation endpoints `GET /api/v1/admin/suggestions`, `PATCH /api/v1/admin/suggestions/:id/status`, `GET /api/v1/admin/reports`, and `PATCH /api/v1/admin/reports/:id/status` restricted to moderator/admin.
  - [x] Unit tests cover submission and status transitions (`suggestions.service.spec.ts`).
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema.prisma`
  - Service: `backend-nest-prisma/src/features/suggestions/suggestions.service.ts`
  - Controller: `backend-nest-prisma/src/features/suggestions/suggestions.controller.ts`
  - Tests: `backend-nest-prisma/src/features/suggestions/suggestions.service.spec.ts`

### TK-SUGG-02: Suggestion & Report Frontend Modals
- **Status**: `[x] Completed` | **Priority**: Medium
- **Description**: Develop UI dialogs allowing users to suggest new prayer times or report issues directly from any mosque card or profile page.
- **Acceptance Criteria**:
  - [x] Component `SuggestionModal.tsx` provides inputs for updating prayer times with 24h format validation.
  - [x] Component `ReportModal.tsx` provides category radio buttons (wrong location, duplicate, closed) and comments.
  - [x] Feedback toast displayed upon successful submission.
  - [x] Responsive layout on both mobile viewports and desktop.
- **Implementation Files**:
  - Components: `frontend/src/components/SuggestionModal.tsx`, `frontend/src/components/ReportModal.tsx`
  - Parent Modals: `frontend/src/components/MosqueDetailModal.tsx`
