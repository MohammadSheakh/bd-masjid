# ADR-045: Mobile Crowdsourced Issue Reporting & Delisting Protection

## Status
Accepted

## Context
Under ADR-020, the BD Masjid platform eliminated artificial centralized verification bottlenecks ("Verified / Unverified / Rejected") in favor of sovereign listing by default. All registered mosques are immediately visible to local musallis. Quality assurance and anti-abuse safeguards operate via reactive **crowdsourced issue reporting** backed by administrative delisting.

The web application provides a reporting flow (`ReportModal.tsx`) calling `POST /mosques/:id/reports` (`MosqueReport` model in Prisma schema). The mobile client requires an accessible, lightweight Ferio modal allowing congregants to report incorrect prayer schedules, shifted GPS map pins, duplicate listings, or permanently closed mosques.

## Decision
1. **Domain Alignment with Backend Contract**:
   - Align mobile payload with `ReportType` enum (`PRAYER_TIME`, `LOCATION`, `CLOSED_MOSQUE`, `DUPLICATE`, `OTHER`).
   - Endpoint: `POST /api/v1/mosques/:id/reports`.
   - Payload: `{ type: string, description: string, contactEmail?: string }`.
2. **Ferio Visual Interaction Pattern (`ReportIssueModal.tsx`)**:
   - Discrete `⚠️ Report an Issue` button placed in the governance section of `MosqueDetailSheet.tsx`.
   - Progressive modal presenting report category selector chips with recognizable icons.
   - Required description input and optional contact email input for moderator follow-up.
3. **Offline Resilience & Optimistic Confirmation**:
   - If the user is offline, the report is saved to synchronous storage and queued for background transmission upon reconnection.
   - User receives immediate positive confirmation toast preventing repeated frustration.

## Consequences
- **Positive**: Direct alignment between web and mobile reporting pipelines; no orphaned mobile features.
- **Positive**: Empowers local community members to report shifted GPS pins or outdated prayer timetables quickly.
- **Compliance**: Adheres strictly to ADR-020 principles, avoiding misleading "unverified" labels.
