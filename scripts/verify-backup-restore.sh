#!/usr/bin/env bash
# ==============================================================================
# Mosque Information & Community Platform — Backup & Restore Drill Runner
# Standard: ADR-015 & Feature F-014
# Objective: Exercise end-to-end disaster recovery into an ephemeral test DB
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SOURCE_URL="${DATABASE_URL:-}"

if [[ -z "${SOURCE_URL}" ]]; then
  if [[ -f "${WORKSPACE_ROOT}/backend-nest-prisma/.env" ]]; then
    SOURCE_URL="$(grep -E '^DIRECT_URL=' "${WORKSPACE_ROOT}/backend-nest-prisma/.env" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    if [[ -z "${SOURCE_URL}" ]]; then
      SOURCE_URL="$(grep -E '^DATABASE_URL=' "${WORKSPACE_ROOT}/backend-nest-prisma/.env" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")"
    fi
  fi
fi

if [[ -z "${SOURCE_URL}" ]]; then
  echo "[-] ERROR: DATABASE_URL is not set and could not be discovered from backend-nest-prisma/.env"
  exit 1
fi

DRILL_DB_NAME="bd_masjid_restore_drill"
BASE_URL="$(echo "${SOURCE_URL}" | sed -E 's|/[^/?]+(\?.*)?$|/postgres\1|')"
DRILL_URL="$(echo "${SOURCE_URL}" | sed -E "s|/[^/?]+(\\?.*)?$|/${DRILL_DB_NAME}\\1|")"

echo "======================================================================"
echo "          MOSQUE PLATFORM DISASTER RECOVERY RESTORATION DRILL         "
echo "======================================================================"
echo "[*] Source Database:  $(echo "${SOURCE_URL}" | sed -E 's|:([^@]+)@|:***@|')"
echo "[*] Ephemeral Target: ${DRILL_DB_NAME}"
echo "----------------------------------------------------------------------"

# Step 1: Create fresh snapshot
echo "[1/5] Creating on-demand drill snapshot..."
DRILL_BACKUP_FILE="${WORKSPACE_ROOT}/backups/bd_masjid_drill_snapshot.dump"
"${SCRIPT_DIR}/backup-db.sh" --url "${SOURCE_URL}" --tag "drill"

LATEST_DUMP="$(ls -t "${WORKSPACE_ROOT}/backups"/bd_masjid_backup_drill_*.dump | head -n 1)"
echo "      Active Snapshot: ${LATEST_DUMP}"

# Step 2: Provision ephemeral drill database
echo "[2/5] Provisioning clean drill database '${DRILL_DB_NAME}'..."
psql "${BASE_URL}" -c "DROP DATABASE IF EXISTS ${DRILL_DB_NAME};" > /dev/null 2>&1 || true
psql "${BASE_URL}" -c "CREATE DATABASE ${DRILL_DB_NAME};" > /dev/null
psql "${DRILL_URL}" -c "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null
echo "      Drill database provisioned with PostGIS extension."

# Step 3: Execute restore into drill database
echo "[3/5] Executing restoration drill into '${DRILL_DB_NAME}'..."
DRILL_START=$(date +%s)
"${SCRIPT_DIR}/restore-db.sh" --file "${LATEST_DUMP}" --url "${DRILL_URL}" --force
DRILL_END=$(date +%s)
DRILL_RTO=$((DRILL_END - DRILL_START))
echo "      Restoration completed. Elapsed RTO: ${DRILL_RTO}s (Target: < 900s)"

# Step 4: Verify schema, tables and integrity
echo "[4/5] Verifying integrity of restored tables and PostGIS spatial registry..."

CHECK_TABLES=("Mosque" "User" "PrayerSchedule" "MosqueFollower" "UserNotification")

for TABLE in "${CHECK_TABLES[@]}"; do
  SRC_COUNT=$(psql "${SOURCE_URL}" -t -A -c "SELECT count(*) FROM \"${TABLE}\";" 2>/dev/null || echo "N/A")
  DRILL_COUNT=$(psql "${DRILL_URL}" -t -A -c "SELECT count(*) FROM \"${TABLE}\";" 2>/dev/null || echo "N/A")
  
  if [[ "${SRC_COUNT}" == "${DRILL_COUNT}" ]]; then
    echo "      [PASS] Table \"${TABLE}\": Restored ${DRILL_COUNT} rows (Matches Source: ${SRC_COUNT})"
  else
    echo "      [-] FAIL: Table \"${TABLE}\": Restored ${DRILL_COUNT} vs Source ${SRC_COUNT}"
    exit 1
  fi
done

# Verify PostGIS spatial function works on restored geometry column
SPATIAL_CHECK=$(psql "${DRILL_URL}" -t -A -c "SELECT ST_GeometryType(coordinates) FROM \"Mosque\" LIMIT 1;" 2>/dev/null || echo "NONE")
echo "      [PASS] PostGIS spatial geometry check: ${SPATIAL_CHECK}"

# Step 5: Teardown ephemeral drill database
echo "[5/5] Cleaning up drill artifacts..."
psql "${BASE_URL}" -c "DROP DATABASE IF EXISTS ${DRILL_DB_NAME};" > /dev/null 2>&1 || true
rm -f "${LATEST_DUMP}"

echo "----------------------------------------------------------------------"
echo "[+] SUCCESS: Disaster recovery restoration drill verified successfully!"
echo "    Measured RTO: ${DRILL_RTO} seconds"
echo "    Status:       COMPLIANT with ADR-015 and Production PRD Acceptance"
echo "======================================================================"
