# ADR-064: Mobile Mosque Leadership Role Claim and Staff Verification Sheet

## Status
Accepted

## Date
2026-10-10

## Context
Mosques across Bangladesh depend on authoritative prayer schedules and community leadership. To allow verified religious leaders (Khatibs, Senior Pesh Imams, Muazzins, Mutawallis, and Committee members) to manage their mosque's official profile, the backend exposes:
`POST /api/v1/community/:id/claims` (ADR-003, ADR-019, `F-019`).

Currently, the mobile client displays staff in `LeadershipRosterCard.tsx` (`GET /api/v1/mosques/:id/staff`), but worshippers who are actual Imams or committee leaders have no in-app flow to claim and verify their official role.

The mobile client requires a dedicated Ferio-styled **Role Claim Modal (`RoleClaimModal.tsx`)** allowing religious leaders and committee members to submit their credentials, service title, contact phone number, and appointment evidence directly from the mobile app with offline outbox fallback.

## Decision
We implement the leadership role claim workflow adhering to:

1. **Role Taxonomy & DTO Alignment (`types/community.ts`)**:
   - `MosqueStaffRole`: `KHATIB | SENIOR_IMAM | IMAM | MUAZZIN | MUTAWALLI | PRESIDENT | SECRETARY | TREASURER | COMMITTEE_MEMBER | KHADEM | CUSTOM`
   - Payload:
     ```ts
     export interface CreateRoleClaimPayload {
       role: MosqueStaffRole;
       customRoleTitle?: string;
       name: string;
       phoneNumber: string;
       evidence?: string;
       documentUrl?: string;
     }
     ```
2. **ApiClient Transport with Offline Outbox Fallback**:
   - `ApiClient.submitRoleClaim(mosqueId: string, payload: CreateRoleClaimPayload)`
   - Calls `POST /api/v1/community/:id/claims` with Bearer auth token.
   - Enqueues into `OfflineOutboxService` when offline.
3. **Ferio Visual Aesthetics (`RoleClaimModal.tsx`)**:
   - Clean multi-select role pill selector (`Khatib`, `Pesh Imam`, `Muazzin`, `Mutawalli`, etc.).
   - Full Name and Contact Phone Number inputs.
   - Evidence text area (committee resolution details, president contact).
   - Instant optimistic success feedback toast and scout points attribution.
4. **Integration Point**:
   - Wired directly into `LeadershipRosterCard.tsx` / `MosqueDetailSheet.tsx` via `👑 Claim Leadership Role / ইমাম বা মুয়াজ্জিন হিসেবে দাবি করুন →`.

## Consequences
- **Positive**: Enables direct onboarding of grassroots Bangladeshi religious leaders into the platform.
- **Positive**: Directly mirrors backend `CreateRoleClaimDto` with zero schema mismatch.
- **Negative**: Role claims require administrative or committee review before badge appears as `VERIFIED`.
