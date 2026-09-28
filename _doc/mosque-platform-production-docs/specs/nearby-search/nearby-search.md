# Feature Specification: Nearby Discovery & Search

## 1. Overview
The Nearby Discovery & Search feature enables users to locate mosques around their current GPS coordinates or any arbitrary map center point, as well as search by text (name, landmark, area).

## 2. Business Invariants
1. **Engine-Level Spatial Math**: Radial distance queries must execute in PostgreSQL/PostGIS using `ST_DWithin` and spherical geometry. Node.js in-memory full-table scans are prohibited.
2. **Capped Query Parameters**: Radius is strictly capped at a maximum of 50,000m (default 5,000m). Page limit is capped at 100 (default 20).
3. **Deterministic Stable Ordering**: Nearby results must be ordered strictly by `distance_meters ASC`.
4. **Calculated Distance Inclusion**: Every item in the nearby list must include the computed distance in meters from the requested point.

## 3. REST API Contracts
- `GET /api/v1/mosques/nearby?latitude=...&longitude=...&radius=...&limit=...`
- `GET /api/v1/mosques?search=...&city=...&page=...&limit=...`

## 4. Extracted Implementation Checklist
- [x] Dedicated `/api/v1/mosques/nearby` endpoint
- [x] Radius capped by DTO validation (`NearbyMosquesQueryDto`)
- [x] Result limit capped (max 100, default 20)
- [x] Stable ordering by spherical distance ascending
- [x] Distance in meters included in response projection
- [x] PostGIS spatial query executed via raw SQL / prisma template tag
- [x] Text search endpoint supporting query by name, city, landmark
- [x] Pagination with page and limit parameters
- [ ] Automated k6 load benchmark under high concurrent query load

## 5. Associated Tickets
- [TK-SRCH-01: PostGIS Spherical Radial Search API](tickets/TK-SRCH-01-postgis-radial-search-api.md)
- [TK-SRCH-02: Text Search & Multi-Criteria Filtering](tickets/TK-SRCH-02-text-search-and-filtering.md)
- [TK-SRCH-03: Frontend Search Bar & Realtime Filtering](tickets/TK-SRCH-03-frontend-search-and-filter.md)
