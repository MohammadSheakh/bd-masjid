---
id: F-005
name: Nearby Discovery & Search
phase: 1
status: completed

depends_on:
  - F-001
  - F-004

blocks:
  - F-009

parallel_with:
  - F-007

source:
  - 01-PRD-PRODUCTION.md#nearby-and-discovery
  - 03-DATA-API-CONTRACTS.md#search-endpoints
  - 06-IMPLEMENTATION-CHECKLIST.md#f-nearby-and-search
---

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

---

## 5. Implementation Slices & Proof of Completion

### TK-SRCH-01: PostGIS Spherical Radial Search API
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Implement the high-performance `/api/v1/mosques/nearby` endpoint utilizing PostGIS spatial queries to find mosques within a bounded radius.
- **Acceptance Criteria**:
  - [x] Input query parameters: `latitude` (float), `longitude` (float), `radius` (integer, max 50000m, default 5000m), `limit` (integer, max 100, default 20).
  - [x] Spatial math performed using `ST_DWithin` on geography coordinates.
  - [x] Returns results ordered by distance ascending.
  - [x] Computes distance in meters and returns as `distance` field.
  - [x] Includes active prayer schedule summary for immediate display.
- **Implementation Files**:
  - DTO: `backend-nest-prisma/src/features/mosques/dto/nearby-mosques.dto.ts`
  - Service: `backend-nest-prisma/src/features/mosques/mosques.service.ts`
  - Controller: `backend-nest-prisma/src/features/mosques/mosques.controller.ts`

### TK-SRCH-02: Text Search & Multi-Criteria Filtering
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Provide a text-based search endpoint allowing queries across mosque name, landmark, address, and city, supporting pagination and status filters.
- **Acceptance Criteria**:
  - [x] Endpoint `GET /api/v1/mosques` accepts `search`, `city`, `verificationStatus`, `operationalStatus`, `page`, `limit`.
  - [x] Performs case-insensitive matching across `name`, `address`, and `landmark`.
  - [x] Returns standard pagination envelope: `data`, `meta: { total, page, limit, totalPages }`.
  - [x] Protects against unbounded queries by enforcing `limit <= 100`.
- **Implementation Files**:
  - DTO: `backend-nest-prisma/src/features/mosques/dto/mosque-query.dto.ts`
  - Service: `backend-nest-prisma/src/features/mosques/mosques.service.ts`
  - Controller: `backend-nest-prisma/src/features/mosques/mosques.controller.ts`

### TK-SRCH-03: Frontend Search Bar & Realtime Filtering
- **Status**: `[x] Completed` | **Priority**: Medium
- **Description**: Integrate the search input into the frontend Navbar and home page, supporting real-time debounced filtering, radius adjustment, and synchronized map viewport updates.
- **Acceptance Criteria**:
  - [x] Search bar in `Navbar.tsx` and main hero in `app/page.tsx`.
  - [x] Debounced user input to prevent excessive API requests.
  - [x] Filtering options for verified-only, facilities (wudu, AC, women's prayer area).
  - [x] Synchronizes with `MosqueMap.tsx` and list view `MosqueCard.tsx`.
- **Implementation Files**:
  - Frontend Component: `frontend/src/components/Navbar.tsx`
  - Home View: `frontend/src/app/page.tsx`
  - Card Component: `frontend/src/components/MosqueCard.tsx`
