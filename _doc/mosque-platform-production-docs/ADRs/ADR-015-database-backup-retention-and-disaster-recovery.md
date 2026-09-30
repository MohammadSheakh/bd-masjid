# ADR-015: Database Backup, Retention Policy, and Disaster Recovery Architecture

## Status
**Accepted**

## Date
2026-09-30

## Deciders
Mohammad Sheakh, Antigravity Platform Engineering Team

---

## Context
Per [01-PRD-PRODUCTION.md](../01-PRD-PRODUCTION.md) (Sections 18 & 19), [04-SECURITY-RELIABILITY-OPERATIONS.md](../04-SECURITY-RELIABILITY-OPERATIONS.md) (§4 Backup and Disaster Recovery), and [06-IMPLEMENTATION-CHECKLIST.md](../06-IMPLEMENTATION-CHECKLIST.md) (§B & §R), the platform requires automated, reliable database snapshot creation, defined retention policies, and a proven restoration procedure before production traffic is served.

In a PostGIS-backed geospatial platform, raw SQL text dumps can suffer from:
1. Inefficient storage for spatial geometries and large historical logs.
2. Inability to restore in parallel (`--jobs`) across CPU cores during an emergency outage.
3. Lack of strict safety guardrails that prevent a developer or script from accidentally overwriting a live production database.

We must define clear operational metrics:
- **RPO (Recovery Point Objective)**: **24 hours** for scheduled daily backups; **< 5 minutes** for pre-deployment/pre-migration snapshots.
- **RTO (Recovery Time Objective)**: **< 15 minutes** to fully provision an empty PostGIS database, restore the snapshot, and verify health probes.

---

## Decision

### 1. Snapshot Format: PostgreSQL Custom Binary Archive (`pg_dump -Fc`)
- Backups will use `pg_dump -Fc` (custom format).
- Advantages:
  - Built-in compression minimizing local and offsite storage costs.
  - Native compatibility with `pg_restore`, supporting parallel restoration (`-j / --jobs`).
  - Selective table restoration capability without parsing gigabytes of plaintext SQL.
  - Preserves PostGIS spatial metadata, table schemas, foreign keys, and GiST indexes.

### 2. Snapshot Retention & Rotation Policy
- Snapshots are written to a centralized, protected directory (`backups/`) with strict `0700` permissions.
- Naming convention: `bd_masjid_backup_YYYYMMDD_HHMMSS.dump`.
- **Local Retention Window**: **7 days**. The backup script will automatically discover and prune snapshot files older than 7 days (`find ... -mtime +7 -delete`).
- Pre-migration snapshots created immediately prior to executing `prisma migrate deploy` are tagged with `pre_migration` and exempted from auto-pruning.

### 3. Safety Guardrails for Restoration
To eliminate the catastrophic risk of running a restore script against the wrong environment:
- `scripts/restore-db.sh` requires:
  1. The path to a valid `.dump` file.
  2. The target database name passed explicitly.
  3. A mandatory confirmation flag `--force` (or interactive verification prompt typing the database name).
- The script automatically checks if the target database contains existing tables and refuses to proceed unless `--force` is explicitly provided.

### 4. Verification Drill (`scripts/verify-backup-restore.sh`)
- Automated verification script that:
  1. Takes an on-demand snapshot of the current database.
  2. Connects to a temporary test database (or creates one).
  3. Executes `pg_restore` against the temporary database.
  4. Runs integrity queries verifying table counts (`Mosque`, `User`, `PrayerSchedule`, `MosqueFollower`, `spatial_ref_sys`) match between source and restored database.
  5. Drops the temporary test database upon completion.

---

## Consequences

### Positive
- **Guaranteed RTO < 15 Minutes**: Fast restoration drill with binary parallel `pg_restore`.
- **Automated Hygiene**: 7-day rolling rotation prevents disk saturation without manual intervention.
- **Fail-Safe Operation**: Prevents accidental destruction of production data through mandatory target confirmations.

### Negative / Trade-offs
- Binary format requires `pg_restore` (cannot be inspected directly with standard text viewers like `cat` or `less`).
