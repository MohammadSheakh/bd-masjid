# ADR-069: Mobile Mosque Committee Official Verification and Proof Document Submission Sheet

## Status
Accepted

## Date
2026-10-10

## Context
Mosques across Bangladesh require authoritative governance to prevent fraudulent donation solicitations, inaccurate prayer schedule changes, or unauthorized committee claims. The platform enforces verified leadership governance (ADR-009, ADR-019, ADR-064) to elevate trusted committee leads (Mutawalli, President, General Secretary, Imam, Muazzin).

The backend exposes dedicated endpoints for submitting verified claims and supporting documentation:
- `POST /api/v1/community/upload-image` (in `CommunityController`, `F-019`): uploads document or person photo up to 5MB and returns verified asset reference / data URL.
- `POST /api/v1/community/:id/claims` (`CreateRoleClaimDto`, `F-019`): registers leadership claim with role (`MUTAWALLI | IMAM | KHATIB | MUAZZIN | COMMITTEE_MEMBER`), contact phone, documentary proof URL, and declaration.
- `GET /api/v1/mosques/:id/role-claims`: retrieves existing claims and live approval statuses (`PENDING`, `APPROVED`, `REJECTED`).

Previously on mobile, `RoleClaimModal.tsx` allowed entering role details and text, but lacked structured document attachment picking, proof type classification, and status tracking for already submitted committee verifications.

The mobile client requires a dedicated Ferio-styled **Committee Verification & Proof Document Submission Sheet (`CommitteeVerificationModal.tsx`)** allowing committee members to select proof document types, attach document images, track verification lifecycle, and display authenticated verification badges.

## Decision
We implement the Mosque Committee Verification & Proof Document Submission flow adhering to:

1. **Domain Contracts & Proof Taxonomy (`types/verification.ts`)**:
   - `VerificationDocumentType`: `COMMITTEE_RESOLUTION | NID_CARD | KHATIB_CERTIFICATE | UTILITY_BILL`
   - `VerificationClaimStatus`: `PENDING | APPROVED | REJECTED`
   - `SubmitVerificationPayload`:
     ```ts
     export interface SubmitVerificationPayload {
       role: string;
       phone: string;
       documentType: VerificationDocumentType;
       documentUrl?: string;
       documentName?: string;
       notes?: string;
     }
     ```
2. **ApiClient Transport**:
   - `ApiClient.uploadVerificationProof(formData: FormData)` -> `POST /api/v1/community/upload-image`
   - `ApiClient.submitCommitteeVerification(mosqueId: string, payload: SubmitVerificationPayload)` -> `POST /api/v1/community/:id/claims`
   - `ApiClient.getMosqueVerificationClaims(mosqueId: string)` -> `GET /api/v1/mosques/:id/role-claims`
3. **Ferio Visual Aesthetics (`CommitteeVerificationModal.tsx`)**:
   - Clean document type chips (Resolution letter, NID, Certificate, Utility bill).
   - Document upload preview card with status indicators (Pending, Approved, Rejected).
   - Official governance advisory disclaimer.
   - Bilingual support for English and Bengali.
4. **Integration Point**:
   - Triggerable from `LeadershipRosterCard.tsx` ("🛡️ Official Verification / অফিসিয়াল ভেরিফিকেশন") and `MosqueDetailSheet.tsx`.

## Consequences
- **Positive**: Completes 100% end-to-end parity with backend `CommunityController` and verified role claim architecture.
- **Positive**: Protects congregations and donors against unauthorized leadership impersonation.
- **Positive**: Provides clear visual tracking of pending vs approved committee credentials.
