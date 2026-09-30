#!/usr/bin/env bash
# ==============================================================================
# Mosque Information & Community Platform — Automated Database Backup
# Standard: ADR-015 & Feature F-014
# Format: PostgreSQL Custom Binary Archive (pg_dump -Fc)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKUP_DIR="${WORKSPACE_ROOT}/backups"
RETENTION_DAYS=7
TAG="scheduled"
DB_URL="${DATABASE_URL:-}"

# Parse optional CLI flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      DB_URL="$2"
      shift 2
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    --dir)
      BACKUP_DIR="$2"
      shift 2
      ;;
    --retention)
      RETENTION_DAYS="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [--url <DATABASE_URL>] [--tag <tag>] [--dir <backup_dir>] [--retention <days>]"
      exit 0
      ;;
    *)
      echo "Unknown flag: $1"
      exit 1
      ;;
  esac
done

if [[ -z "${DB_URL}" ]]; then
  # Fallback to local .env in backend-nest-prisma if available
  # Prefer DIRECT_URL for pg_dump (bypasses PgBouncer transaction pooling on Neon/Supabase)
  if [[ -f "${WORKSPACE_ROOT}/backend-nest-prisma/.env" ]]; then
    DB_URL="$(grep -E '^DIRECT_URL=' "${WORKSPACE_ROOT}/backend-nest-prisma/.env" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    if [[ -z "${DB_URL}" ]]; then
      DB_URL="$(grep -E '^DATABASE_URL=' "${WORKSPACE_ROOT}/backend-nest-prisma/.env" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")"
    fi
  fi
fi

if [[ -z "${DB_URL}" ]]; then
  echo "[-] ERROR: DATABASE_URL is not set and could not be discovered from backend-nest-prisma/.env"
  exit 1
fi

# Ensure backups directory exists with restrictive permissions (0700)
mkdir -p "${BACKUP_DIR}"
chmod 0700 "${BACKUP_DIR}"

TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILENAME="bd_masjid_backup_${TAG}_${TIMESTAMP}.dump"
BACKUP_FILEPATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

echo "[*] Initiating PostgreSQL snapshot..."
echo "    Target File: ${BACKUP_FILEPATH}"
echo "    Format:      PostgreSQL Custom Binary (-Fc)"

START_TIME=$(date +%s)

# Execute pg_dump with custom binary format
pg_dump --dbname="${DB_URL}" \
        --format=custom \
        --compress=6 \
        --no-owner \
        --no-acl \
        --file="${BACKUP_FILEPATH}"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [[ ! -s "${BACKUP_FILEPATH}" ]]; then
  echo "[-] ERROR: Backup file was not created or is 0 bytes: ${BACKUP_FILEPATH}"
  exit 1
fi

FILE_SIZE="$(du -h "${BACKUP_FILEPATH}" | cut -f1)"
echo "[+] Snapshot created successfully in ${DURATION}s (${FILE_SIZE})"

# Enforce rolling retention policy (prune standard snapshots older than RETENTION_DAYS)
echo "[*] Enforcing ${RETENTION_DAYS}-day rolling retention in ${BACKUP_DIR}..."
find "${BACKUP_DIR}" -type f -name "bd_masjid_backup_scheduled_*.dump" -mtime +"${RETENTION_DAYS}" -print -delete || true

echo "[+] Backup pipeline complete."
