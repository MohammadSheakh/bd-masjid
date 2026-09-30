#!/usr/bin/env bash
# ==============================================================================
# Mosque Information & Community Platform — Production Deployment Script
# ADR-018 & Feature F-017
#
# Usage:
#   ./scripts/deploy.sh [--skip-backup] [--no-build]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
STATE_FILE="${ROOT_DIR}/.last_successful_deployment"

echo "========================================================================"
echo "  Mosque Platform Production Deployment — Automated Zero-Downtime Rollout"
echo "========================================================================"
echo "  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "  Root Dir:  ${ROOT_DIR}"
echo "========================================================================"

cd "${ROOT_DIR}"

SKIP_BACKUP=false
NO_BUILD=false

for arg in "$@"; do
  case $arg in
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --no-build)
      NO_BUILD=true
      shift
      ;;
    *)
      ;;
  esac
done

# ------------------------------------------------------------------------------
# 1. Capture Pre-Deployment State
# ------------------------------------------------------------------------------
CURRENT_GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
echo "📌 Current Git SHA to deploy: ${CURRENT_GIT_SHA}"

# ------------------------------------------------------------------------------
# 2. Mandatory Pre-Deployment Database Snapshot
# ------------------------------------------------------------------------------
if [ "${SKIP_BACKUP}" = false ]; then
  echo ""
  echo "📦 Step 1: Creating pre-deployment database snapshot..."
  if [ -x "${SCRIPT_DIR}/backup-db.sh" ]; then
    "${SCRIPT_DIR}/backup-db.sh" || {
      echo "❌ Deployment aborted: Pre-deployment backup failed."
      exit 1
    }
  else
    echo "⚠️ Warning: backup-db.sh not executable or not found; proceeding with caution."
  fi
else
  echo "⚠️ Skipping pre-deployment backup per --skip-backup flag."
fi

# ------------------------------------------------------------------------------
# 3. Build & Pull Container Images
# ------------------------------------------------------------------------------
echo ""
echo "🔨 Step 2: Building container images..."
if [ "${NO_BUILD}" = false ]; then
  docker compose build --pull backend frontend
else
  echo "⏩ Skipping build per --no-build flag."
fi

# ------------------------------------------------------------------------------
# 4. Non-Destructive Database Migrations (Expand-and-Contract)
# ------------------------------------------------------------------------------
echo ""
echo "🗄️ Step 3: Validating and applying database schema migrations..."
# Using the backend container entrypoint or explicit pnpm prisma migrate deploy
if command -v pnpm &>/dev/null && [ -d "backend-nest-prisma" ]; then
  (cd backend-nest-prisma && pnpm prisma:migrate:deploy) || {
    echo "❌ Migration failed! Aborting deployment before recreating containers."
    exit 1
  }
else
  echo "ℹ️ Migrations will be executed automatically by container docker-entrypoint.sh."
fi

# ------------------------------------------------------------------------------
# 5. Rolling Container Deployment
# ------------------------------------------------------------------------------
echo ""
echo "🚀 Step 4: Recreating and starting production containers..."
docker compose up -d --remove-orphans backend frontend redis

# ------------------------------------------------------------------------------
# 6. Post-Deployment Automated Health Probe Verification
# ------------------------------------------------------------------------------
echo ""
echo "🩺 Step 5: Verifying application health probes..."
BACKEND_HEALTH_URL="http://127.0.0.1:6733/api/v1/health"
FRONTEND_URL="http://127.0.0.1:3005"

MAX_ATTEMPTS=15
ATTEMPT=1
HEALTH_OK=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "  [Attempt ${ATTEMPT}/${MAX_ATTEMPTS}] Checking backend (${BACKEND_HEALTH_URL})..."
  if curl -sf --max-time 3 "${BACKEND_HEALTH_URL}" >/dev/null 2>&1; then
    echo "  ✅ Backend health check passed!"
    HEALTH_OK=true
    break
  fi
  sleep 3
  ATTEMPT=$((ATTEMPT + 1))
done

if [ "${HEALTH_OK}" = false ]; then
  echo ""
  echo "❌ CRITICAL: Backend failed to report healthy within 45 seconds!"
  echo "🔄 Initiating automated zero-downtime rollback..."
  if [ -x "${SCRIPT_DIR}/rollback.sh" ]; then
    "${SCRIPT_DIR}/rollback.sh"
  fi
  exit 1
fi

# ------------------------------------------------------------------------------
# 7. Record State & Complete Deployment
# ------------------------------------------------------------------------------
echo "${CURRENT_GIT_SHA}" > "${STATE_FILE}"
echo ""
echo "========================================================================"
echo "  🎉 Deployment Complete & Verified!"
echo "  Deployed Version: ${CURRENT_GIT_SHA}"
echo "  Backend Health:   ${BACKEND_HEALTH_URL} (200 OK)"
echo "  State Saved:      ${STATE_FILE}"
echo "========================================================================"
exit 0
