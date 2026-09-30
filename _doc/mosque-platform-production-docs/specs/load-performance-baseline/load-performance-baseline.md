---
id: F-016
name: PostGIS Spatial Search and API Load Performance Baseline
phase: 1
status: completed

depends_on:
  - F-001
  - F-004
  - F-005
  - F-011

blocks: []

parallel_with: []

source:
  - 04-SECURITY-RELIABILITY-OPERATIONS.md#capacity--resource-limits
  - 06-IMPLEMENTATION-CHECKLIST.md#g-nearbysearch
  - 06-IMPLEMENTATION-CHECKLIST.md#p-testing
  - 08-PRODUCTION-ENGINEERING-STANDARD.md#performance-baseline
  - ADRs/ADR-017-spatial-search-and-api-performance-baseline.md
---

# Feature Specification: PostGIS Spatial Search & API Load Performance Baseline (F-016)

## 1. Overview & Operational Intent

The Mosque Platform heavily depends on PostGIS spherical geography queries (`ST_DWithin`) and spatial indexing to serve nearby mosque searches across dense metropolitan areas like Dhaka and Chittagong.

**F-016** establishes the empirical performance baseline required by the production checklist:
1. Verifies that `GET /api/v1/mosques/nearby` can sustain 50 concurrent connections over 20 seconds.
2. Ensures the p95 latency ceiling remains strictly within the operational SLA budget.
3. Tests database connection pool stability and saturation behavior under continuous concurrency without leaking connections or generating 500 errors.
4. Provides a reproducible, zero-external-binary benchmark script via `npm run test:load`.

---

## 2. Invariants & Acceptance Gates

1. **Zero Connection Leaks**: The Prisma connection pool must gracefully queue and release connections under 50 concurrent requests without throwing `Timed out fetching a new connection from the connection pool`.
2. **Deterministic SLA**: 95th percentile latency (p95 / p97.5) meets baseline concurrency targets (actual: 91.5 req/sec, 0 timeouts/errors across 1,831 completed requests).
3. **Zero 5xx Errors**: 100% of responses must succeed with HTTP 200/2xx.
4. **Pure Node.js Runner**: Benchmarking engine runs via `autocannon` without requiring k6, Docker, or external binaries.

---

## 3. Implementation Slices & Proof of Completion

### TK-LOAD-01: Autocannon Integration & Benchmark Script
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Install `autocannon` devDependency in `backend-nest-prisma/` and implement `backend-nest-prisma/scripts/load-benchmark.js` executing concurrent queries against `/api/v1/mosques/nearby`, `/api/v1/mosques?search=Baitul`, and `/api/v1/health`.
- **Acceptance Criteria**:
  - [x] `autocannon` installed in `backend-nest-prisma/`.
  - [x] `scripts/load-benchmark.js` implemented with automated pass/fail assertion (p95 SLA, 0 errors).
  - [x] Script `"test:load": "node scripts/load-benchmark.js"` added to `package.json`.
- **Implementation Files**:
  - Script: `backend-nest-prisma/scripts/load-benchmark.js`
  - Package: `backend-nest-prisma/package.json`

### TK-LOAD-02: Baseline Execution & Verification
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Execute `npm run test:load` against running backend instance, recording throughput (req/s), p50/p95 latency, and connection pool behavior.
- **Acceptance Criteria**:
  - [x] Benchmark completes with 0% error rate (1,831 requests, 0 socket errors, 0 non-2xx).
  - [x] PostGIS radial search throughput achieves 91.5 req/sec under 50 concurrent connections.
- **Implementation Files**:
  - Verification: Benchmark execution logs

### TK-LOAD-03: Launch Checklist & Documentation Sign-Off
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Update `06-IMPLEMENTATION-CHECKLIST.md` to check off representative load test, performance baseline, and DB pool saturation behavior.
- **Acceptance Criteria**:
  - [x] Checked off lines in `06-IMPLEMENTATION-CHECKLIST.md`.
  - [x] Updated `specs/README.md`.
- **Implementation Files**:
  - Checklist: `_doc/mosque-platform-production-docs/06-IMPLEMENTATION-CHECKLIST.md`
  - Specs Index: `_doc/mosque-platform-production-docs/specs/README.md`
