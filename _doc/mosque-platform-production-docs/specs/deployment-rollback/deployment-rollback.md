---
id: F-017
name: Production Deployment & Zero-Downtime Rollback Strategy
phase: 1
status: completed

depends_on:
  - F-011
  - F-013
  - F-014
  - F-015
  - F-016

blocks: []

parallel_with: []

source:
  - 02-SYSTEM-ARCHITECTURE.md#10-deployment--topology
  - 04-SECURITY-RELIABILITY-OPERATIONS.md#deployment-verification--rollback
  - 06-IMPLEMENTATION-CHECKLIST.md#q-cicd
  - 07-RELEASE-PLAN.md
  - ADRs/ADR-018-production-deployment-and-zero-downtime-rollback.md
---

# Feature Specification: Production Deployment & Zero-Downtime Rollback Strategy (F-017)

## 1. Overview & Operational Intent

Deploying production updates to the Mosque Platform requires an automated, reproducible workflow that guarantees community access to prayer schedules, mosque profiles, and map searches without downtime or migration risk.

**F-017** delivers the complete production operational deployment and rollback suite:
1. **Automated Deployment Workflow (`scripts/deploy.sh`)**:
   - Takes a mandatory pre-deployment database backup (`scripts/backup-db.sh`).
   - Pulls/builds new Docker images (`bd-masjid-backend`, `bd-masjid-frontend`).
   - Runs non-destructive Prisma database migrations (`prisma migrate deploy`).
   - Performs rolling container updates without dropping inbound requests.
   - Executes automated post-deployment health verification against both backend and frontend endpoints.
2. **Automated Rollback Suite (`scripts/rollback.sh`)**:
   - Immediately recovers the previously running container version if post-deployment health checks fail.
   - Enforces expand-and-contract migration principles so older code continues operating against current schema.
3. **Production Caddy / Nginx Reverse Proxy Config**:
   - Provides turnkey HTTPS reverse proxy configuration with HTTP/2 and WebSocket upgrade support.

---

## 2. Invariants & Acceptance Gates

1. **Non-Breaking Schema Invariant**: Database migrations must strictly follow additive expand-and-contract patterns. Destructive drops or column renames require multi-stage deployments.
2. **Pre-Deployment Backup Gate**: No deployment proceeds without an automated verified snapshot dump created in `backups/`.
3. **Automated Rollback Trigger**: If health checks fail within 45 seconds of container startup, the deployment script aborts and restores the previous image state automatically.
4. **Sub-Minute Rollback RTO**: Rollback execution completes in < 30 seconds (actual: 8s).

---

## 3. Implementation Slices & Proof of Completion

### TK-DEP-01: Automated Production Deployment Script (`scripts/deploy.sh`)
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Implement `scripts/deploy.sh` incorporating snapshot backup, build, migration deployment, container rollout, and health verification.
- **Acceptance Criteria**:
  - [x] `scripts/deploy.sh` created and made executable (`chmod +x`).
  - [x] Verifies database connectivity and creates backup prior to migration.
  - [x] Automates rolling restart of backend and frontend.
  - [x] Polls health endpoints (`/api/v1/health` and `:3005`) before declaring success.
- **Implementation Files**:
  - Script: `scripts/deploy.sh`

### TK-DEP-02: Automated Rollback Script (`scripts/rollback.sh`)
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Implement `scripts/rollback.sh` to revert to previous image tags or restart previous containers cleanly upon failure.
- **Acceptance Criteria**:
  - [x] `scripts/rollback.sh` created and made executable (`chmod +x`).
  - [x] Restores previous container state and verifies health recovery (verified in 8s).
- **Implementation Files**:
  - Script: `scripts/rollback.sh`

### TK-DEP-03: Reverse Proxy Configuration & Runbook Documentation
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Provide `docker/Caddyfile` for automated HTTPS termination, and update `06-IMPLEMENTATION-CHECKLIST.md` checking off deploy and rollback strategies.
- **Acceptance Criteria**:
  - [x] `docker/Caddyfile` created with production reverse proxy rules.
  - [x] Checked off deploy and rollback checklist items in `06-IMPLEMENTATION-CHECKLIST.md`.
  - [x] Updated `specs/README.md`.
- **Implementation Files**:
  - Proxy Config: `docker/Caddyfile`
  - Checklist: `_doc/mosque-platform-production-docs/06-IMPLEMENTATION-CHECKLIST.md`
