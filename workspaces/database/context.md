# database workspace context

## Domain scope
Owns the Drizzle schema, SQLite connection/client setup, migrations, and seed infrastructure (including the deterministic scenario generator's persistence layer). Does not own metric computation logic (that's `analytics`) — only the storage shape and how rows get written.

## Key files planned
- `src/lib/db/schema.ts` — Drizzle schema for all 10 tables (see `docs/implementation-roadmap.md` §3): organizations, users, memberships, data_connections, sync_runs, metrics, targets, findings, briefs, deliveries.
- `src/lib/db/client.ts` — `better-sqlite3` connection, `DATABASE_PATH` from env.
- `src/lib/env.ts` — Zod env validation (`LLM_API_KEY` optional, `LLM_BASE_URL`, `DATABASE_PATH`).
- `scripts/db-seed.ts` (or `src/lib/db/seed.ts` + `npm run db:seed`) — creates the demo org/user/5 connections, then invokes the scenario generator (owned conceptually by `intelligence`/`analytics`, but this workspace owns the script that persists its output).
- `drizzle.config.ts`, migration output directory.

## Interfaces owned
- The Drizzle schema types are the shared vocabulary every other workspace imports (`Metric`, `Finding`, `Brief`, `DataConnection`, etc.).
- `DATABASE_PATH` env contract.

## Decisions from Workflow 01
- SQLite via `better-sqlite3` + Drizzle, not Postgres/Docker — PRD's own override note + CLAUDE.md Resource Budget. Schema must use only Postgres-portable types (documented swap path in `docs/architecture.md`).
- Comparisons (DoD/WoW/7-day-avg/target-variance) are NOT a persisted table — pure functions over `metrics`/`targets`, computed on demand by the `analytics` workspace.
- `credentials_ref` on `data_connections` is a documented stub column, not real encryption (all providers are simulated in the MVP).

## Open items
- Exact `metric_key` taxonomy per domain — finalized in Phase 3 when mock providers are built (owned by `analytics`, but affects this schema's `metrics` table indexing).
- Nothing implemented yet — this workspace starts fresh in Phase 2 (`workflows/02-foundation.md`).
