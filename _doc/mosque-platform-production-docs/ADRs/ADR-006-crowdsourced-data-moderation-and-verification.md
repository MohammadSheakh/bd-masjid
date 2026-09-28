# ADR-006: Crowdsourced Suggestions, Reports, and Mosque Verification Workflow

## Status
**Accepted**

## Date
2026-09-28

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
Community feedback is critical to maintaining accurate prayer times, addresses, and facilities for thousands of mosques. However, allowing public users to directly mutate canonical mosque records introduces severe risks of accidental errors, outdated submissions, or malicious defacement.
Conversely, if submissions require days of manual review before anything happens, community members become discouraged from contributing.

## Decision
1. **Never Directly Overwrite Canonical Records**:
   - Community edits are stored as independent entities (`MosqueSuggestion` and `MosqueReport`) rather than directly modifying `Mosque` or `PrayerSchedule`.
   - Suggestions and reports progress through explicit moderation state machines: `OPEN` -> `UNDER_REVIEW` -> `RESOLVED` / `REJECTED`.
2. **Four-Stage Mosque Verification State Machine**:
   - Every mosque possesses a `verificationStatus`:
     - `UNVERIFIED`: Newly created by community, visible on map with unverified indicator.
     - `PENDING_VERIFICATION`: Community has submitted supporting evidence or requested review.
     - `VERIFIED`: Inspected and approved by a moderator/admin.
     - `REJECTED`: Found to be duplicate, invalid, or inappropriate.
3. **Audit Trail on All Moderation**:
   - When a moderator resolves a suggestion, applies proposed prayer times, or verifies a mosque:
     - `reviewedById` and `reviewedAt` are recorded.
     - An immutable row is created in `AuditLog` capturing the previous state, new state, and moderation notes.
4. **Abuse & Spam Defense**:
   - Public suggestion and report endpoints are strictly rate-limited using a sliding window guard.
   - Text inputs are bounded by length validators and sanitized against XSS.

## Consequences

### Positive
- **Data Integrity**: Canonical platform data remains protected from vandalism.
- **Traceability**: Every verification and resolution action is fully attributable to a verified moderator.
- **Community Trust**: Users see real-time status of their suggestions.

### Tradeoffs & Mitigations
- **Moderator Backlog**: High submission volume could cause backlog in pending verifications.
  - *Mitigation*: Unverified mosques are still searchable and visible with a subtle badge; filtered admin queues allow batch review.

## References
- System Architecture: `_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md`
- Verification Service: `backend-nest-prisma/src/features/mosque-verification/`
- Suggestions Service: `backend-nest-prisma/src/features/suggestions/`
