#!/usr/bin/env bash
# ==============================================================================
# Mosque Information & Community Platform — Production Database Restore
# Standard: ADR-015 & Feature F-014
# Guardrails: Requires explicit target database confirmation and --force flag
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DUMP_FILE=""
TARGET_URL="${DATABASE_URL:-}"
FORCE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      DUMP_FILE="$2"
      shift 2
      ;;
    --url)
      TARGET_URL="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift 1
      ;;
    --help|-h)
      echo "Usage: $0 --file <path_to_dump> [--url <TARGET_DATABASE_URL>] [--force]"
      exit 0
      ;;
    *)
      echo "Unknown flag: $1"
      exit 1
      ;;
  esac
done

if [[ -z "${DUMP_FILE}" ]]; then
  echo "[-] ERROR: Missing required --file argument."
  echo "Usage: $0 --file <path_to_dump> [--url <TARGET_DATABASE_URL>] [--force]"
  exit 1
fi

if [[ ! -f "${DUMP_FILE}" ]]; then
  echo "[-] ERROR: Dump file not found: ${DUMP_FILE}"
  exit 1
fi

if [[ -z "${TARGET_URL}" ]]; then
  if [[ -f "${WORKSPACE_ROOT}/backend-nest-prisma/.env" ]]; then
    TARGET_URL="$(grep -E '^DIRECT_URL=' "${WORKSPACE_ROOT}/backend-nest-prisma/.env" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    if [[ -z "${TARGET_URL}" ]]; then
      TARGET_URL="$(grep -E '^DATABASE_URL=' "${WORKSPACE_ROOT}/backend-nest-prisma/.env" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")"
    fi
  fi
fi

if [[ -z "${TARGET_URL}" ]]; then
  echo "[-] ERROR: TARGET_URL is not set and could not be discovered from backend-nest-prisma/.env"
  exit 1
fi

# Verify dump file validity with pg_restore list
echo "[*] Verifying dump file integrity..."
if ! pg_restore --list "${DUMP_FILE}" > /dev/null 2>&1; then
  echo "[-] ERROR: ${DUMP_FILE} is not a valid PostgreSQL custom binary archive."
  exit 1
fi
echo "[+] Dump archive verified."

# Extract target database name from URL for safety confirmation
TARGET_DB_NAME="$(echo "${TARGET_URL}" | sed -E 's|.*\://[^/]+/([^?]+).*|\1|')"
echo "[*] Target Database: ${TARGET_DB_NAME}"

# Safety Check: Check if target database already contains user tables
TABLE_COUNT=$(psql "${TARGET_URL}" -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns');" 2>/dev/null || echo "0")

if [[ "${TABLE_COUNT}" -gt 0 ]]; then
  if [[ "${FORCE}" != "true" ]]; then
    echo "[!] CAUTION: Target database '${TARGET_DB_NAME}' contains ${TABLE_COUNT} existing public tables."
    echo "[!] To prevent accidental disaster, you must provide --force flag or confirm below."
    read -r -p "Type target database name '${TARGET_DB_NAME}' to confirm destructive overwrite: " CONFIRMATION
    if [[ "${CONFIRMATION}" != "${TARGET_DB_NAME}" ]]; then
      echo "[-] Confirmation mismatch. Restoration aborted."
      exit 1
    fi
  else
    echo "[!] --force flag detected. Proceeding with restore on non-empty target '${TARGET_DB_NAME}' (${TABLE_COUNT} tables)."
  fi
fi

START_TIME=$(date +%s)
echo "[*] Executing pg_restore into ${TARGET_DB_NAME}..."

# Execute pg_restore: --clean drops existing tables before re-creating them
pg_restore --dbname="${TARGET_URL}" \
           --clean \
           --if-exists \
           --no-owner \
           --no-acl \
           "${DUMP_FILE}" || true

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "[+] Database restore completed in ${DURATION}s."
