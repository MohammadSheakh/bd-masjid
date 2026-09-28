# Feature Specification: Mosque Registry & Creation Slice

## 1. Overview
The Mosque Registry is the core domain of the platform, enabling users to discover mosques, view detailed profiles (including facilities and current status), and contribute new mosques via an interactive pin-drop map interface with spatial duplicate detection.

## 2. Business Invariants
1. **Name and Coordinates Required**: Every mosque must possess a non-empty name and valid WGS84 geographic coordinates (`latitude` between -90 and 90, `longitude` between -180 and 180).
2. **Spatial Proximity Duplicate Guard**: New submissions must be checked against existing mosques within a 50-meter spherical radius using PostGIS. If duplicate candidates exist, warning or conflict is enforced.
3. **Default Unverified State**: Every newly created mosque enters the system with `verificationStatus = UNVERIFIED`.
4. **Server-Derived Provenance**: If the creator is authenticated, `createdById` is derived from the server's verified JWT context, not trusted from client payloads.
5. **Direct URL Accessibility**: Mosque profiles (`/mosques/[id]`) must be fully accessible and render completely without requiring the map to load.

## 3. Data Model Reference (`Mosque`)
- `id`: CUID primary key
- `name`: string (required)
- `latitude`, `longitude`: Float (WGS84)
- `address`, `landmark`, `city`, `country`: string
- `operationalStatus`: `OPEN` | `TEMPORARILY_CLOSED` | `PERMANENTLY_CLOSED` | `UNDER_CONSTRUCTION` | `UNKNOWN`
- `verificationStatus`: `UNVERIFIED` | `PENDING_VERIFICATION` | `VERIFIED` | `REJECTED`
- Facilities: `hasWuduArea`, `hasSeparateWomenSpace`, `hasAirConditioning`, `hasParking`, `hasWheelchairAccess`, `hasJanazaFacility`, `capacity`
- Relations: `prayerSchedule`, `attendances`, `suggestions`, `reports`, `staffMembers`, `donationMethods`

## 4. REST API Contracts
- `POST /api/v1/mosques` — Create a new mosque
- `POST /api/v1/mosques/check-duplicate` — Check for candidate duplicates within 50m
- `GET /api/v1/mosques/:id` — Public mosque profile with facilities and prayer times
- `PATCH /api/v1/mosques/:id` — Update mosque details (restricted to staff/moderator/admin)

## 5. Extracted Implementation Checklist
- [x] Add Mosque UI modal with interactive map pin-drop
- [x] Name validation and coordinate boundary validation
- [x] Optional address and landmark support
- [x] Backend creation API (`POST /api/v1/mosques`)
- [x] Server-side actor derivation for creator provenance
- [x] PostGIS duplicate proximity query (`ST_DWithin` 50m)
- [x] Interactive pre-flight duplicate warning in modal UI
- [x] Default unverified state (`MosqueVerificationStatus.UNVERIFIED`)
- [x] Created mosque immediately reflected on frontend map
- [x] Dedicated profile page (`/mosques/[id]`) operating independently of map
- [x] Backend service integration tests (`mosques.service.spec.ts`)
- [ ] Automated browser E2E test for mosque creation flow

## 6. Associated Tickets
- [TK-MOSQ-01: Mosque Database Schema & Spatial Indexing](tickets/TK-MOSQ-01-schema-and-indexing.md)
- [TK-MOSQ-02: Mosque Creation & Duplicate Detection API](tickets/TK-MOSQ-02-creation-and-duplicate-api.md)
- [TK-MOSQ-03: Mosque Profile Endpoint & Standalone Page](tickets/TK-MOSQ-03-profile-endpoint-and-page.md)
- [TK-MOSQ-04: Add Mosque Modal & Pin-Drop UI](tickets/TK-MOSQ-04-add-mosque-modal-ui.md)
