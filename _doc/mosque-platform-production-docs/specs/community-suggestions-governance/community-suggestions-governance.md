---
id: F-038
name: Community Mosque Suggestions, Complaints & Targeted Role Feedback Governance
phase: 2
status: completed

depends_on:
  - F-001
  - F-004
  - F-006
  - F-020

blocks: []

parallel_with:
  - F-036
  - F-037

source:
  - 01-PRD-PRODUCTION.md#crowdsourced-data-updates-and-moderation
  - 02-SYSTEM-ARCHITECTURE.md#authorization-model
  - 03-DATA-API-CONTRACTS.md#suggestions-endpoints
  - 06-IMPLEMENTATION-CHECKLIST.md#f-crowdsourced-updates-and-moderation
  - ADRs/ADR-027-community-suggestions-and-role-targeted-feedback-governance.md
---

# Feature Specification: Community Mosque Suggestions, Complaints & Targeted Role Feedback Governance

## 1. Overview
Provides a dedicated, production-grade suggestion and grievance modal triggered from the primary quick action `Suggest` button on mosque profiles. Allows worshippers and community members to submit categorized feedback (suggestions, complaints, improvements, maintenance) with urgency indicators, direct multiple-role targeting (Imam, Khadem, Muazzin, Khatib, Committee, or General Community), optional submitter contact details, and granular visibility controls (`COMMITTEE_ONLY` vs `PUBLIC`).

---

## 2. Business Invariants
1. **Modal Decoupling**: The quick-action `Suggest` button on mosque detail cards triggers `MosqueSuggestionModal`. The prayer timetable edit button remains dedicated to `SuggestionModal` (prayer timetable updates per ADR-021).
2. **Category & Urgency Validity**: Submissions must validate against `SuggestionType` (`SUGGESTION`, `COMPLAINT`, `IMPROVEMENT`, `MAINTENANCE`) and `SuggestionUrgency` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
3. **Multi-Role Recipient Routing**: `targetRoles` stores array of target designations (`IMAM`, `MUAZZIN`, `KHATIB`, `KHADEM`, `COMMITTEE`, `GENERAL`). At least one target role is required (defaults to `COMMITTEE` or `GENERAL`).
4. **Visibility & Privacy Boundary**:
   - `visibility: COMMITTEE_ONLY` (default for complaints and private grievances) is accessible exclusively to verified mosque personnel (`MOSQUE_ADMIN`, `MUTAWALLI`, committee members) and platform administrators/moderators.
   - `visibility: PUBLIC` items are viewable by all platform users and musallis in public suggestion feeds.
   - Submitter phone numbers are strictly scrubbed/redacted from public read responses to prevent doxxing and spam.
5. **Rate Limiting & Content Limits**: Community submissions are throttled via `SlidingWindowRateLimitGuard` (15 submissions/minute/IP), with descriptions bounded between 10 and 2000 characters.

---

## 3. Data Model Reference
Prisma model additions in `prisma/schema/suggestions.module/suggestions.prisma`:
```prisma
enum SuggestionType {
  SUGGESTION
  COMPLAINT
  IMPROVEMENT
  MAINTENANCE
}

enum SuggestionUrgency {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum SuggestionVisibility {
  COMMITTEE_ONLY
  PUBLIC
}

// Extended fields on MosqueSuggestion:
// type            SuggestionType       @default(SUGGESTION)
// urgency         SuggestionUrgency    @default(MEDIUM)
// visibility      SuggestionVisibility @default(COMMITTEE_ONLY)
// targetRoles     String[]             @default([])
// submitterName   String?
// submitterPhone  String?
```

---

## 4. REST API Contracts
- `POST /api/v1/mosques/:id/suggestions` (Public submission with rate limiting)
  - Payload: `{ type, urgency, visibility, targetRoles, submitterName?, submitterPhone?, description }`
- `GET /api/v1/mosques/:id/suggestions/public` (Public community suggestion feed)
  - Response: `{ items: MosqueSuggestionPublicItem[], meta: PaginationMeta }`
  - Ensures private fields (phone) are excluded.
- `GET /api/v1/admin/suggestions` (Moderation & committee query with filters)
  - Query params: `status`, `type`, `urgency`, `visibility`, `targetRole`, `mosqueId`, `page`, `limit`

---

## 5. Extracted Implementation Checklist
- [x] Schema update with enums, fields, and migration
- [x] Backend DTOs with class-validator decorators
- [x] SuggestionsService and Controller public endpoint and committee visibility logic
- [x] Backend unit test coverage for new suggestion categories and privacy rules
- [x] Frontend API and TypeScript types
- [x] Ferio-compliant `MosqueSuggestionModal` component with accessible form controls
- [x] Mosque detail drawer integration and public suggestions section

---

## 6. Implementation Slices & Proof of Completion

### TK-SUGG-03: Relational Schema, Migrations & Extended Suggestion DTOs
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Add suggestion category, urgency, visibility, target roles, and submitter contact fields in Prisma schema and generate migrations.
- **Acceptance Criteria**:
  - [x] Schema syncs and migration applies cleanly to PostgreSQL.
  - [x] DTO enforces enum validation and character bounds.
- **Implementation Files**:
  - `backend-nest-prisma/prisma/schema/suggestions.module/suggestions.prisma`
  - `backend-nest-prisma/prisma/migrations/20261004100911_add_suggestion_type_urgency_roles_visibility/migration.sql`
  - `backend-nest-prisma/src/features/suggestions/dto/create-suggestion.dto.ts`

### TK-SUGG-04: Suggestions Service, Public Filtering API & Security Bounds
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Implement submission handler for targeted roles and public suggestions read endpoint with phone redaction.
- **Acceptance Criteria**:
  - [x] Service persists role targeting and visibility correctly.
  - [x] Public endpoint returns only `PUBLIC` non-rejected items without sensitive phone info.
  - [x] Unit tests pass with 100% coverage of new paths.
- **Implementation Files**:
  - `backend-nest-prisma/src/features/suggestions/suggestions.service.ts`
  - `backend-nest-prisma/src/features/suggestions/suggestions.controller.ts`
  - `backend-nest-prisma/src/features/suggestions/test/suggestions.service.spec.ts`
  - `backend-nest-prisma/src/features/suggestions/test/suggestions.controller.spec.ts`

### TK-SUGG-05: Dedicated Ferio Frontend Suggestion Modal & Quick Action Wireup
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Build accessible `MosqueSuggestionModal` matching Ferio design guidelines and wire to quick action `Suggest` button.
- **Acceptance Criteria**:
  - [x] Quick action button opens `MosqueSuggestionModal` instead of timetable updater.
  - [x] Allows selecting category, urgency, target roles, visibility, optional name/phone, and details.
  - [x] Timetable edit button continues to work for prayer schedules.
- **Implementation Files**:
  - `frontend/src/types/mosque.ts`
  - `frontend/src/lib/api.ts`
  - `frontend/src/components/MosqueSuggestionModal.tsx`
  - `frontend/src/components/MosqueDetailModal.tsx`
  - `frontend/src/app/page.tsx`
