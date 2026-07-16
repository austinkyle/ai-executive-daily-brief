# database workspace context

## Domain scope
Owns the Drizzle schema, SQLite connection/client setup, migrations, and seed infrastructure (including the deterministic scenario generator's persistence layer). Does not own metric computation logic (that's `analytics`) — only the storage shape and how rows get written.

## Key files planned
- `src/lib/db/schema.ts` — Drizzle schema for all 10 tables (see `docs/implementation-roadmap.md` §3): organizations, users, memberships, data_connections, sync_runs, metrics, targets, findings, briefs, deliveries.
- `src/lib/db/client.ts` — `better-sqlite3` connection, `DATABASE_PATH` from env.
- `src/lib/env.ts` — Zod env validation (`LLM_API_KEY` optional, `LLM_BASE_URL`, `DATABASE_PATH`).
- `scripts/db-seed.ts` (or `src/lib/db/seed.ts` + `npm run db:seed`) — creates the demo org/user/5 connections, then invokes the scenario generator (owned conceptually by `intelligence`/`analytics`, but this workspace owns the script that persists its output).
- `drizzle.config.ts`, migration output directory.

## Implemented in Phase 2 (`workflows/02-foundation.md`)
- `src/lib/db/schema.ts` — all 10 tables built, text-UUID primary keys, `integer(..., {mode:'timestamp'})` for datetimes, `real` for numeric values, `text(..., {mode:'json'})` (`$type<...>()`-tagged) for JSON columns (`evidence_metric_refs`, `wins`/`risks`/`opportunities`/`recommended_actions`/`key_numbers`/`evidence_finding_refs`). No `onDelete` cascade rules yet — fine at demo scale (only additive seed inserts so far); revisit if Phase 3+ ever needs cascading deletes.
- `src/lib/db/client.ts` — default-exports the drizzle instance; **note:** connecting to SQLite (and `mkdirSync`-ing the DB dir) happens as an import-time side effect, not lazily. Fine for scripts/API routes, but any future unit test that imports a module which transitively imports `db/client` will touch the real filesystem unless that test mocks/isolates it — worth a lazy-init wrapper if that becomes a friction point in Phase 3+.
- `drizzle.config.ts` + `npm run db:push` (`drizzle-kit push`, auto-creates `./data/` dir).
- `src/lib/env.ts` — exports both a pure `parseEnv(raw)` (used by `env.test.ts`) and the module-level `env` singleton parsed from `process.env` at import time. `DATABASE_PATH` defaults to `./data/app.db`.
- `src/lib/db/seed.ts` + `npm run db:seed` (run via `tsx`) — idempotent (delete-then-insert in a single `db.transaction`), fixed PRNG seed `42`, row ids via `crypto.randomUUID()`. Creates exactly: 1 org ("Northbound Supply Co."), 1 user ("Alex Morgan"), 1 membership (`role: "owner"`), 5 `data_connections` (`shopify`, `meta`, `google-ads`, `klaviyo`, `gorgias`; `is_simulated: true`, `status: "connected"`, `credentials_ref: "simulated"`). Verified idempotent by running twice — row counts stay 1/1/1/5.
- `src/lib/util/prng.ts` — `createPrng(seed)` (mulberry32) + `randInt`/`pick` helpers. Owned here since Task C needed it first, but this is the shared utility Phase 3's scenario generator (owned by `analytics`) will reuse — do not duplicate a second PRNG there.
- `src/lib/domain/index.ts` — hand-written interfaces (not raw re-exports of Drizzle's `$inferSelect` types) mirroring all 10 entities.
- `src/lib/logger.ts` — ~30-line structured JSON console logger (`logger.info/warn/error`), no dependency.

## Interfaces owned
- The Drizzle schema types are the shared vocabulary every other workspace imports (`Metric`, `Finding`, `Brief`, `DataConnection`, etc.).
- `DATABASE_PATH` env contract.

## Decisions from Workflow 01
- SQLite via `better-sqlite3` + Drizzle, not Postgres/Docker — PRD's own override note + CLAUDE.md Resource Budget. Schema must use only Postgres-portable types (documented swap path in `docs/architecture.md`).
- Comparisons (DoD/WoW/7-day-avg/target-variance) are NOT a persisted table — pure functions over `metrics`/`targets`, computed on demand by the `analytics` workspace.
- `credentials_ref` on `data_connections` is a documented stub column, not real encryption (all providers are simulated in the MVP).

## Open items
- Exact `metric_key` taxonomy per domain — finalized in Phase 3 when mock providers are built (owned by `analytics`, but affects this schema's `metrics` table indexing).
- No indexes added yet beyond primary keys — revisit if Phase 3's comparison-engine queries (by `org_id`+`date`+`metric_key`) show up as slow at 30-day scale (unlikely, but cheap to add later).
- `db/client.ts`'s import-time connection side effect (see above) — watch for it in Phase 3 test design.
