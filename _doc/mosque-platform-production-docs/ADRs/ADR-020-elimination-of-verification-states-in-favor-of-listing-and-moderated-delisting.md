# ADR-020: Elimination of Mosque Verification States in Favor of Sovereign Listing and Moderated Delisting

## Status
Accepted

## Date
2026-10-03

## Context
In previous iterations, the platform used a centralized verification paradigm modeled after corporate social networks (`MosqueVerificationStatus`: `UNVERIFIED`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`). Every community-added mosque began as `UNVERIFIED` and was placed in an administrative "Pending Queue" awaiting platform moderator approval. 

In practice, this model introduced several critical flaws:
1. **User Confusion & Hostile Friction**: Legitimate mosques submitted by local musallis were labeled with conspicuous "Unverified" badges across maps, cards, and modal popups. This diminished user trust and made the platform feel incomplete.
2. **Artificial Moderation Bottleneck**: Platform admins cannot physically inspect thousands of mosques across Bangladesh prior to listing them. Mosques should be community-discoverable immediately upon registration.
3. **Inverted Trust Model**: Public community registries (like OpenStreetMap, Wikipedia, and local directory services) operate on a listing-by-default model paired with crowdsourced issue reporting and reactive administrative delisting for abuse or errors.

## Decision
We eliminate the concept of "Verified / Unverified / Rejected" mosques across the entire platform.

1. **Immediate Public Listing (`isListed: true`)**:
   - All newly registered mosques are sovereign and immediately visible on the public map, nearby spatial search (`ST_DWithin`), and directory queries.
   - No "Verified" or "Unverified" badges are displayed anywhere on the public interface (navbar branding, mosque cards, map popups, or detail modals).

2. **Crowdsourced Issue Reporting as Primary Signal**:
   - Any user (registered or guest) can report a mosque for incorrect prayer timetables, wrong location, duplicate entry, permanent closure, or fake/spam information via the existing `MosqueReport` domain.

3. **Administrative Delisting & Relisting (`isListed: false / true`)**:
   - Platform administrators and moderators can **Delist** an inaccurate, duplicate, or flagged mosque (`isListed: false`, with `unlistedReason`, `unlistedAt`, and `unlistedById`).
   - Delisted mosques are **completely excluded from public discovery**: they do NOT appear on the map, in nearby radial queries, or in public search results.
   - Platform administrators can inspect unlisted mosques in the Enterprise Admin Console, correct or update their information, and **Relist** them (`isListed: true`) once discrepancies are resolved.
   - Every delist and relist transition writes an immutable `AuditLog` entry (`MOSQUE_UNLISTED`, `MOSQUE_LISTED`).

4. **Streamlined Admin Console**:
   - The artificial "Pending Verification Queue" is decommissioned.
   - Admin directory adds a **Listing Status** filter (`ALL`, `LISTED`, `UNLISTED`).
   - Admin inspection modals provide 1-click Delist / Relist governance actions with audit reason capture.

## Consequences

### Positive
- **Instant Community Utility**: Congregants can find newly added mosques and timetables immediately without waiting for central bureaucratic approval.
- **Clean, Trustworthy Ferio UI**: Eliminates distracting and untrustworthy "Unverified" chips across the entire user experience.
- **Focus on Actionable Moderation**: Administrative attention shifts from rubber-stamping valid mosques to actively resolving community issue reports and delisting invalid entries.

### Negative / Trade-offs
- An intentionally false or malicious pin could momentarily appear on the map until reported by the community and delisted by an admin. This is mitigated by existing proximity duplicate detection (50m warning), rate limiting, and administrative soft-delete capabilities.
