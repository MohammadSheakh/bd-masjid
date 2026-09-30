# ADR-017: PostGIS Spatial Search and API Load Performance Baseline

## Status
Accepted

## Date
2026-09-30

## Context
The Mosque Platform relies on PostgreSQL with PostGIS as its single source of truth for spatial queries (`ST_DWithin`, spherical geography indices, and complex dynamic filtering). Under high community usage—such as prayer time checks, Jumu'ah traffic spikes, or Ramadan—the spatial search endpoint (`GET /api/v1/mosques/nearby`) is subjected to bursty read concurrency.

Before entering production, the engineering standard (`04-SECURITY-RELIABILITY-OPERATIONS.md`, `08-PRODUCTION-ENGINEERING-STANDARD.md`) requires:
1. An empirical latency baseline (p95 < 150ms).
2. Verification of database connection pool stability under concurrent load without connection starvation or 5xx leaks.
3. Automated benchmarking executable locally and in CI without introducing heavy external infrastructure or daemon dependencies.

## Decision
1. **Tooling**: Adopt `autocannon` as the automated HTTP load benchmarking engine, installed as a development dependency in `backend-nest-prisma/` and executed via `npm run test:load`.
2. **Traffic Profile**: Run a multi-scenario benchmark:
   - **Scenario 1 (Spatial Discovery)**: Concurrent requests to `GET /api/v1/mosques/nearby?lat=23.8103&lng=90.4125&radiusKm=5` stressing PostGIS spatial bounding index.
   - **Scenario 2 (Text Search)**: `GET /api/v1/mosques/search?q=Baitul` evaluating trigram/text queries.
   - **Scenario 3 (Health Probe)**: `GET /api/v1/health` evaluating low-overhead routing.
3. **Performance Gate & Thresholds**:
   - Concurrency: 50 concurrent connections over 20 seconds.
   - Latency Threshold: p95 latency must remain < 150ms.
   - Error Rate: 0% 5xx errors; 0 connection pool exhaustion exceptions.
4. **Execution Script**: Encapsulate the benchmark in `backend-nest-prisma/scripts/load-benchmark.js`, returning non-zero exit code if error rate exceeds 0% or p95 latency breaches the 150ms threshold.

## Consequences

### Positive
- Zero external binary installation required (runs cross-platform via pure Node.js).
- Provides immediate quantitative verification of PostGIS index and Prisma connection pool tuning.
- Satisfies launch readiness checklist gates for load and performance baselines.

### Negative / Trade-offs
- Benchmarking against cloud databases (e.g. Neon) over wide-area networks introduces external latency variance; local containerized benchmarks provide the cleanest baseline.
