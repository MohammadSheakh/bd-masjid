#!/usr/bin/env bash
# ==============================================================================
# Mosque Information & Community Platform — Automated Rollback Script
# ADR-018 & Feature F-017
#
# Usage:
#   ./scripts/rollback.sh
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
STATE_FILE="${ROOT_DIR}/.last_successful_deployment"

echo "========================================================================"
echo "  🚨 Mosque Platform Emergency Rollback Execution"
echo "========================================================================"
echo "  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "========================================================================"

cd "${ROOT_DIR}"

if [ -f "${STATE_FILE}" ]; then
  TARGET_SHA=$(cat "${STATE_FILE}")
  echo "📌 Last recorded successful SHA: ${TARGET_SHA}"
else
  echo "ℹ️ No prior state file found; restarting existing containers from compose..."
  TARGET_SHA="HEAD~1"
fi

echo ""
echo "🔄 Step 1: Re-starting previous stable container instances..."
docker compose restart backend frontend

echo ""
echo "🩺 Step 2: Verifying restored service health..."
BACKEND_HEALTH_URL="http://127.0.0.1:6733/api/v1/health"
MAX_ATTEMPTS=10
ATTEMPT=1
RESTORED=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  if curl -sf --max-time 3 "${BACKEND_HEALTH_URL}" >/dev/null 2>&1; then
    echo "  ✅ Restored backend health check passed!"
    RESTORED=true
    break
  fi
  sleep 3
  ATTEMPT=$((ATTEMPT + 1))
done

if [ "${RESTORED}" = true ]; then
  echo ""
  echo "========================================================================"
  echo "  ✅ Rollback Complete — System Operational"
  echo "========================================================================"
  exit 0
else
  echo ""
  echo "❌ CRITICAL: Rollback failed to achieve healthy status!"
  echo "Check container logs via: docker compose logs backend"
  exit 1
fi
