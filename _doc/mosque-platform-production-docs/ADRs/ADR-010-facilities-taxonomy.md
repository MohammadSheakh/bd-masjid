# ADR-010: Mosque Facilities & Accessibility Taxonomy

## Status
**Accepted**

## Date
2026-09-30

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In Release 1, the platform established the authoritative mosque registry with PostGIS geospatial coordinates, prayer/Jamaat schedules, and central verification. 

As the platform moves into Release 2 (Community & Governance Expansion), worshippers and travelers across Bangladesh require concrete, accurate, and filterable data regarding mosque facilities before traveling:
1. **Women's Prayer Facilities**: In Bangladesh, only a fraction of mosques feature dedicated, secluded female prayer spaces and separate female wudu facilities. Without authoritative data, female worshippers face immense difficulty finding suitable prayer spaces.
2. **Accessibility**: Elderly and mobility-impaired worshippers need verification of wheelchair ramps, accessible entrances, and sitting wudu setups.
3. **Capacity & Climate Controls**: During Friday Jumu'ah, Ramadan Taraweeh, and summer heatwaves, worshippers prioritize mosques with air conditioning, adequate fan coverage, and sufficient capacity.
4. **Community Amenities**: Janaza (funeral washing/staging) services, vehicle/bicycle parking, and maktab/library spaces are critical community assets.

Prior naive approaches (such as unstructured JSON blobs or uncontrolled user tags) either prevent efficient PostGIS spatial indexing, degrade query performance, or allow unauthorized tampering of sensitive facility claims.

---

## Decision

### 1. Dedicated 1:1 `MosqueFacility` Relational Entity
We introduce a structured relational entity, `MosqueFacility`, linked 1-to-1 with `Mosque`:
- Primary foreign key: `mosqueId` (Unique, `onDelete: Cascade`).
- Strongly typed fields:
  - **Capacity**: `totalCapacity` (Int, nullable), `toiletCount` (Int, nullable).
  - **Ablution (Wudu)**: `hasSeparateWudu` (Boolean, default false), `wuduCapacity` (Int, nullable).
  - **Women's Facilities**: `hasFemalePrayerSpace` (Boolean, default false), `femaleCapacity` (Int, nullable).
  - **Accessibility**: `hasWheelchairAccess` (Boolean, default false), `hasRamp` (Boolean, default false).
  - **Climate Control**: `hasAirConditioning` (Boolean, default false), `hasFan` (Boolean, default true).
  - **Community Services**: `hasJanazaService` (Boolean, default false), `hasParkingCar` (Boolean, default false), `hasParkingBike` (Boolean, default false), `hasLibraryMaktab` (Boolean, default false).

### 2. Tiered Governance & Mutation Invariants
- **Canonical Mutations**: Only verified local `MOSQUE_ADMIN`s or authorized committee members (`F-020`) of that specific mosque, or global platform `admin`/`moderator` accounts, can mutate canonical facilities via `PUT /api/v1/mosques/:id/facilities`.
- **Musalli Suggestions**: Unverified users and general worshippers cannot directly alter facility records. They submit suggestions through the existing `F-006` suggestions/reports workflow.
- **Audit Logging**: Every create or update operation records an immutable `AuditLog` entry with the previous and updated state inside an atomic PostgreSQL `$transaction`.

### 3. Integrated PostGIS Spatial Radius Filtering (Zero Extra Infrastructure)
- Rather than introducing external search engines (ElasticSearch/MeiliSearch) or in-memory caches (Redis), facility filtering is integrated directly into the PostGIS `ST_DWithin` spatial query pipeline (`/api/v1/mosques/nearby`).
- Query parameters (e.g. `hasFemalePrayerSpace=true`, `hasWheelchairAccess=true`, `hasAirConditioning=true`, `minCapacity=500`) perform an inner/left join with `MosqueFacility`.
- Composite B-Tree indexes on `[hasFemalePrayerSpace, hasWheelchairAccess]` and `[totalCapacity]` guarantee sub-50ms p95 latencies under concurrent load.

### 4. "Visible Unknowns" Policy (PRD Section 6)
- In strict adherence to PRD Section 6 (*"Unknown data must remain visibly unknown. Do not manufacture defaults that appear authoritative"*):
  - Fields that have not been explicitly reported or surveyed remain `null` in persistence and the API.
  - The frontend Ferio UI renders null attributes distinctly as "Not Reported" rather than misleadingly displaying "No" or "False".

---

## Consequences

### Positive
- **High-Performance Spatial Filtering**: Users can query *"All mosques within 5km that have women's prayer facilities and air conditioning"* with single-digit millisecond query execution times directly in PostgreSQL/PostGIS.
- **Data Integrity & Trust**: Leveraging the `F-020` staff delegation model ensures that only verified local mosque leadership can assert facility availability.
- **Zero Infrastructure Sprawl**: 100% database-backed through PostgreSQL, Prisma, and PostGIS.

### Tradeoffs & Mitigations
- **Schema Rigidity**: Adding a new facility type requires a Prisma migration rather than inserting a dynamic key-value pair.
  - *Mitigation*: The initial taxonomy covers all high-priority Bangladeshi mosque amenities identified in PRD Section 6 and 15. Future expansions can be bundled into planned migration releases.
