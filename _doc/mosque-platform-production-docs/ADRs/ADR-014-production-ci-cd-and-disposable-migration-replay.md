# ADR-014: Production CI/CD Pipeline and Disposable Migration Replay

## Status
**Accepted**

## Date
2026-09-30

## Deciders
Mohammad Sheakh, Antigravity Platform Engineering Team

---

## Context
Per [01-PRD-PRODUCTION.md](../01-PRD-PRODUCTION.md) (Section 19), [04-SECURITY-RELIABILITY-OPERATIONS.md](../04-SECURITY-RELIABILITY-OPERATIONS.md), and [06-IMPLEMENTATION-CHECKLIST.md](../06-IMPLEMENTATION-CHECKLIST.md) (§B & §N), the platform requires automated continuous integration (CI) to prevent regression, guarantee database migration replayability, and enforce production build integrity before any code reaches production.

Specifically:
1. **Migration Replay Verification**: Migrations must apply cleanly (`prisma migrate deploy`) on a disposable, pristine PostgreSQL + PostGIS service container from scratch to ensure no schema drift or broken DDL exists.
2. **Deterministic Parallel Testing**: Backend unit, service, controller, and gateway test suites must execute in isolated test environments with zero flaky dependencies.
3. **Frontend Production Build Verification**: Next.js with Turbopack must compile cleanly in production mode without type errors or broken client-side dependencies.
4. **Fast Feedback**: Jobs must execute concurrently in parallel tracks with dependency caching to maintain total runtime under 3 minutes.

---

## Decision

### 1. Workflow Architecture & GitHub Actions Runner
We establish `.github/workflows/ci.yml` triggered on:
- Every `push` to `main`.
- Every `pull_request` targeting `main`.

The workflow consists of three decoupled jobs:
1. **`backend-ci`**:
   - Spawns a disposable service container: `postgis/postgis:16-3.4-alpine` with health checks on port `5432`.
   - Runs on `ubuntu-latest` with Node.js 20 LTS.
   - Caches `~/.npm` dependencies.
   - Generates Prisma client (`npx prisma generate`).
   - Executes migration replay (`npx prisma migrate deploy`) against the disposable PostGIS container.
   - Executes NestJS production build (`npm run build`).
   - Executes full automated test suites (`npm test -- --coverage=false`).
2. **`frontend-ci`**:
   - Runs on `ubuntu-latest` with Node.js 20 LTS in parallel with `backend-ci`.
   - Caches `~/.npm` and `.next/cache`.
   - Validates TypeScript types (`npm run build`).
3. **`code-quality`**:
   - Audits workspace integrity and validates format/linting.

### 2. Migration Replay Policy (Zero Drift Enforcement)
- Production migrations strictly run through `prisma migrate deploy`.
- Using `prisma db push` in CI or production is explicitly prohibited.
- If a migration contains syntax errors, missing PostGIS spatial triggers, or unmet foreign key dependencies, the `backend-ci` job fails immediately, blocking deployment.

---

## Consequences

### Positive
- **Automated Gatekeeping**: Prevents broken migrations or broken TypeScript builds from being merged into `main`.
- **Ephemeral PostGIS Validation**: Confirms spatial extension (`CREATE EXTENSION IF NOT EXISTS postgis;`) and GiST spatial indexes work on actual PostgreSQL engines.
- **Fast Developer Feedback**: Parallel jobs ensure independent frontend and backend feedback within ~2 minutes.

### Negative / Trade-offs
- Requires GitHub Actions runner minutes.
- Service container initialization introduces a ~15-second startup latency.
