# Prisma scope

Read [root](../../AGENTS.md) and [backend](../AGENTS.md) instructions first.
Applies to schema fragments, generated schema, migrations, seeds, and Prisma tooling.

## Production Documentation Authority

- For persistence and geospatial design, read [02-SYSTEM-ARCHITECTURE.md](../../_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md).
- For domain entities, data model, and API invariants, read [03-DATA-API-CONTRACTS.md](../../_doc/mosque-platform-production-docs/03-DATA-API-CONTRACTS.md).
- For database backup, restore, and operational procedures, read [04-SECURITY-RELIABILITY-OPERATIONS.md](../../_doc/mosque-platform-production-docs/04-SECURITY-RELIABILITY-OPERATIONS.md).
- For database query, indexing, and constraint policies, read [database rules](../../.agents/rules/backend-database.md).
- For atomic multi-write boundaries, read [transaction rules](../../.agents/rules/backend-transactions.md).

## Local tooling and gotchas

- Edit `schema/` fragments; `schema.prisma` is generated. Use the package's
  `pnpm run prisma:sync` to rebuild and generate; generation alone does not rebuild fragments.
- Keep the application single-tenant and preserve database-level PostGIS constraints.
- Canonical mosque position is PostGIS `geography(Point, 4326)`. Spatial queries run database-side.
- Migration scripts are not permission to apply ad-hoc SQL. Never reset shared production data or bypass migration history with `db push`.
- Seeds preview by default; writes require `--apply` and explicit database URL.
  Preserve source data and insert-only behavior. Read [seed/adoption workflow](_doc.md).

## Verification

- Schema validation/generation: `pnpm run prisma:sync`
- Migration status: `pnpm run prisma:migrate:status`
- Migration dev: `pnpm run prisma:migrate:dev`
- Report runtime evidence separately; generation does not establish deployed parity.
