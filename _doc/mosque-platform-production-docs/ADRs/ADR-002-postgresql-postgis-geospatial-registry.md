# ADR-002: PostgreSQL with PostGIS as Authoritative Geospatial Registry

## Status
**Accepted**

## Date
2026-09-28

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
Mosque discovery requires accurate radial distance calculations, nearby spatial queries, and geographic bounding. Two core architectural questions arose:
1. Should the platform sync mosque nodes directly from OpenStreetMap (OSM) or own its mosque database?
2. Should geospatial proximity queries be computed inside application memory (Node.js) or pushed down into the database engine?

If OpenStreetMap was treated as the authoritative database, the platform would inherit crowdsourced OSM vandalism, schema drift, lack of verified prayer schedules, and inability to support transactional verification workflows or custom community management.
If radial queries were calculated in Node.js by fetching all mosques and iterating over them with the Haversine formula, memory usage would balloon and query times would degrade rapidly as mosque count scaled.

## Decision
1. **PostgreSQL/PostGIS as Durable Source of Truth**: The platform owns and persists all mosque entities, geographic coordinates (`latitude`, `longitude`), and verification state in PostgreSQL with PostGIS extensions.
2. **OpenStreetMap for Cartographic Tiles Only**: OpenStreetMap (OSM) tile servers or compatible raster/vector tile providers are used strictly as passive background map rendering in the web browser. No mosque data is synced from or written back to OSM.
3. **Database-Level Geospatial Queries**: All proximity searches (`/api/v1/mosques/nearby`) and duplicate checks use native PostGIS spherical spatial operations (`ST_DWithin`, `ST_DistanceSphere` or `ST_SetSRID(ST_MakePoint(...), 4326)`) backed by spatial indexes. In-memory Node full-table scans are strictly prohibited.
4. **Bounded Geospatial Parameters**: All nearby endpoints strictly enforce maximum query radius (e.g. 5,000 meters) and pagination limits (default 20, max 100) to protect database capacity.

## Consequences

### Positive
- **Deterministic Accuracy**: Microsecond spatial calculations directly executed by PostgreSQL's optimized geometry/geography engine.
- **Data Sovereignty**: The platform maintains complete authority over verification status, mosque history, facility attributes, and prayer times without external OSM schema dependencies.
- **Low Memory Footprint**: Node.js receives only the filtered, ordered, and paginated result set with pre-calculated distances in meters.

### Tradeoffs & Mitigations
- **PostGIS Extension Dependency**: PostgreSQL instances require PostGIS installed.
  - *Mitigation*: Automated database setup scripts and Docker images include PostGIS by default; migrations run controlled extension enablement (`CREATE EXTENSION IF NOT EXISTS postgis`).

## References
- System Architecture: `_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md`
- Data & API Contracts: `_doc/mosque-platform-production-docs/03-DATA-API-CONTRACTS.md`
