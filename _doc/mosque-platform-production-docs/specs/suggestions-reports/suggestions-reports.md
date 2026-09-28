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

## 6. Associated Tickets
- [TK-SUGG-01: Suggestions & Reports Persistence API](tickets/TK-SUGG-01-persistence-and-api.md)
- [TK-SUGG-02: Suggestion & Report Frontend Modals](tickets/TK-SUGG-02-frontend-modals.md)
