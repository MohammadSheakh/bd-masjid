# ADR-027: Community Mosque Suggestions, Complaints & Targeted Role Feedback Governance

## Status
**Accepted**

## Date
2026-10-04

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In previous releases (`F-006`, `F-034`, `ADR-021`, `ADR-025`), suggestions were split between automated prayer timetable adjustments and facility amenity contributions. However, a major user-facing gap persisted on the mosque profile:
1. **Conflated "Suggest" Action**: Clicking the primary quick-action `Suggest` button at the bottom of the mosque drawer opened the prayer timetable editor rather than a dedicated community suggestion or feedback channel.
2. **Missing Grievance & Feedback Granularity**: Worshippers, neighbors, and regular attendees had no mechanism to submit complaints, maintenance issues, or operational proposals with urgency designations (Low, Medium, Urgent).
3. **Absence of Role-Targeted Routing**: Feedback in Bangladeshi mosques typically pertains to distinct operational stakeholders—e.g. hygiene/cleanliness directed to the *Khadem*, Azan acoustics directed to the *Muazzin*, Khutbah/guidance topics directed to the *Imam*, or financial/infrastructure decisions directed to the *Committee/Mutawalli*.
4. **Visibility & Privacy Governance**: Sensitive feedback or complaints must be restrictable to verified mosque committee leadership only (`COMMITTEE_ONLY`), while general constructive proposals can be shared publicly (`PUBLIC`) so regular musallis can see community feedback.

---

## Decision

### 1. Dedicated Suggestion & Grievance Modal (`MosqueSuggestionModal`)
- The quick-action `Suggest` button on the mosque profile launches `MosqueSuggestionModal`.
- The prayer timetable edit button inside the Prayer Times section remains dedicated to `SuggestionModal` (timetable updating per ADR-021).
- The modal features:
  - **Category / Level**: `SUGGESTION`, `COMPLAINT`, `IMPROVEMENT`, `MAINTENANCE`.
  - **Urgency Level**: `LOW`, `MEDIUM`, `HIGH` (Urgent).
  - **Target Roles (Multi-select)**: Mosque roles (`IMAM`, `MUAZZIN`, `KHATIB`, `KHADEM`, `COMMITTEE`, `GENERAL`).
  - **Visibility**:
    - `COMMITTEE_ONLY`: Visible exclusively to verified mosque staff, committee, and platform moderators.
    - `PUBLIC`: Visible to committee members and all community viewers/worshippers.
  - **Submitter Identification (Optional)**: Optional submitter name and optional contact phone number (authenticated users can auto-populate, anonymous users can submit voluntarily).
  - **Details**: Validated text description (10–2000 characters).

### 2. Relational Schema & State Governance in PostgreSQL/Prisma
- Extend `MosqueSuggestion` in `prisma/schema/suggestions.module/suggestions.prisma`:
  - `type`: `SuggestionType` enum (`SUGGESTION`, `COMPLAINT`, `IMPROVEMENT`, `MAINTENANCE`) default `SUGGESTION`.
  - `urgency`: `SuggestionUrgency` enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) default `MEDIUM`.
  - `visibility`: `SuggestionVisibility` enum (`COMMITTEE_ONLY`, `PUBLIC`) default `COMMITTEE_ONLY`.
  - `targetRoles`: Native string array `String[]` default `[]` storing targeted roles.
  - `submitterName`: Optional `String?`.
  - `submitterPhone`: Optional `String?`.
  - Composite indexes: `@@index([mosqueId, visibility, createdAt])` for fast public feed lookups.

### 3. Public Feedback Access & Privacy Safeguards
- Public endpoint `GET /api/v1/mosques/:id/suggestions/public`:
  - Returns only items where `visibility = PUBLIC` and `status != REJECTED`.
  - Anonymizes phone numbers from public responses to prevent spam and doxxing.
  - Protected with rate limiting (`SlidingWindowRateLimitGuard`).
- Committee / Moderation endpoint `GET /api/v1/admin/suggestions` & mosque manager:
  - Authorized staff and admins can query all incoming suggestions, filter by target role, category, and urgency, and record resolution notes.

---

## Consequences

### Positive
- **Role-Aware Mosque Communication**: Clean routing of complaints to relevant mosque custodians (Imam, Khadem, Committee).
- **Privacy Assurance**: Sensitive grievances remain private to leadership, while community-wide suggestions foster civic transparency.
- **Ferio Aesthetic & Usability**: Replaces confusing timetable popup with a modern, structured community feedback dialog.
- **Zero New Infrastructure**: Built natively on existing PostgreSQL/Prisma relational foundations with index optimization.

### Negative / Trade-offs
- Multiple roles selected requires array containment queries in PostgreSQL (`targetRoles hasSome [...]`).
- *Mitigation*: Array queries are scoped to specific `mosqueId` foreign key indexes, keeping execution times under 10ms.
