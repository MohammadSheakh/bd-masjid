# ADR-005: Two-Tier Spatial Proximity Duplicate Detection at Mosque Creation

## Status
**Accepted**

## Date
2026-09-28

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
Crowdsourced mosque entry poses a high risk of duplicate records:
- Different users may spell mosque names differently (e.g. "Baitul Mukarram", "Baytul Mokarram", "National Mosque").
- Text-based duplicate matching fails on phonetic, spelling, or Bangla-English script variations.
- In dense urban areas (e.g. Old Dhaka), multiple mosques might exist within 100 meters, so a coarse distance check could reject legitimate nearby mosques, while no distance check invites rampant duplicate spam.

## Decision
1. **Two-Tier Duplicate Architecture**:
   - **Tier 1 (Interactive Pre-flight Check)**:
     - As the user places a pin on the map, the frontend calls `POST /api/v1/mosques/check-duplicate` with the coordinates.
     - The API returns existing mosques within a **50-meter spherical radius** using PostGIS `ST_DWithin`.
     - The UI presents warning banners with links to existing mosque profiles: *"A mosque already exists 18m away: Baitul Aman Jame Masjid. Is this the mosque you are trying to add?"*
   - **Tier 2 (Server-Side Enforced Creation Guard)**:
     - On submission (`POST /api/v1/mosques`), the server repeats the 50m proximity search.
     - If an exact duplicate exists or an unconfirmed duplicate candidate is detected, the server returns HTTP 409 Conflict with duplicate candidates, unless an explicit override flag is supplied with admin/moderator justification.
2. **Initial State Invariant**:
   - Every freshly created mosque entity defaults to `verificationStatus = UNVERIFIED`.
   - New mosques do not automatically obtain a `VERIFIED` checkmark until approved by a moderator.

## Consequences

### Positive
- **Drastic Reduction in Duplicate Noise**: Users are alerted before they even submit the form.
- **Robust Against Name Variations**: Distance-based checking catches duplicates regardless of language (English/Bangla) or transliteration differences.
- **Data Quality**: Preserves high platform trust.

### Tradeoffs & Mitigations
- **Dense Mosque Clusters**: In rare historic areas, two distinct prayer rooms/mosques may be within 50m.
  - *Mitigation*: The UI provides an option to proceed with an explicit justification note, routing the submission into the moderator verification queue.

## References
- System Architecture: `_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md`
- Mosque Service: `backend-nest-prisma/src/features/mosques/mosques.service.ts`
