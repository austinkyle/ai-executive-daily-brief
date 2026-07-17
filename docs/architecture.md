# Architecture

Status: outline stub, written in Workflow 01. Full detail lands progressively as each phase completes, with a final pass in Phase 6.

## Outline

1. **System overview** — modular monolith, single Next.js (App Router) process. No microservices, no separate worker process, no queue. Background-style work (ingestion, brief generation) runs as server actions / API routes / npm scripts, not daemons.
2. **Module map** — `src/lib/domain`, `src/lib/integrations` (provider adapters), `src/lib/analytics` (comparison/rule/anomaly engines), `src/lib/intelligence` (finding prioritization, cross-domain rules), `src/lib/ai` (LLM abstraction, prompt, schema, fallback), `src/lib/delivery` (delivery simulation), `src/lib/db` (Drizzle schema + client). Boundaries and why they replace the PRD's suggested `packages/*` layout — see `implementation-roadmap.md` §2.
3. **Data flow diagram** — provider adapter → ingestion/sync_run → metrics table → comparison engine → rule engine → anomaly scoring → cross-domain rules → prioritization → AI pipeline → briefs table → UI. (To be rendered as an actual diagram once the pipeline is built — see `implementation-roadmap.md` §4–5 for the current textual version.)
4. **SQLite → Postgres swap path** — Drizzle schema uses only Postgres-portable types. Swap = change the Drizzle driver (`better-sqlite3` → `pg`/`postgres.js`), update `DATABASE_PATH`/connection-string env handling, re-run migrations against a Postgres instance. No schema rewrite required. Document exact steps once Phase 2 schema is final.
5. **Mock → real provider swap path** — each mock adapter implements the same `DataProvider` interface (`fetchDailyMetrics(orgId, date)`); a real integration is a new adapter behind the same interface plus real credentials in `data_connections.credentials_ref`. No changes needed downstream of ingestion.
6. **Security posture** — no real auth in the MVP (single implicit demo org/user); `credentials_ref` is a stub since all providers are simulated; where a real secrets vault (KMS/Vault) would sit in a production deployment.
7. **Scaling/observability notes** — intentionally out of scope for a 30-day/1-org demo; note what would need to change for a real multi-tenant deployment (this feeds `consulting-implementation.md`).

To be filled in during/after Phases 2–6, each phase updating the relevant section as it's built.

## SQLite to Postgres swap path

The current `src/lib/db/schema.ts` uses SQLite Drizzle builders, so the migration is a deliberate adapter/schema-boundary change rather than a database-file copy:

1. Provision a Postgres database and provide a connection-string configuration path in place of the local `DATABASE_PATH` file-path handling.
2. Replace `better-sqlite3` and the Drizzle SQLite client/dialect with a supported Postgres driver (`pg` or `postgres.js`) and Drizzle's Postgres client/dialect.
3. Change `drizzle.config.ts` to use the Postgres dialect and the Postgres connection configuration.
4. Translate `sqliteTable` and SQLite column builders to `pgTable` and equivalent Postgres builders, retaining table/column names and foreign-key relationships.
5. Re-run `drizzle-kit generate`, review the generated migration, and apply it to the Postgres environment; then migrate or re-seed data as appropriate.
6. Run the existing ingestion, intelligence, AI, and UI tests against the Postgres-backed configuration, then verify concurrent generation and connection-pooling behavior at the expected production load.

The schema has no SQLite-only storage types: it uses text IDs/dates, `real` numeric values, integer-backed booleans/timestamps, and JSON serialized in text columns. The first two are portable logical choices, but they are **not mechanically identical builders**: `integer({ mode: "timestamp" })` must become a Postgres timestamp/timestamptz decision, `integer({ mode: "boolean" })` becomes a Postgres boolean, and `text(..., { mode: "json" })` should become `json`/`jsonb` (or remain serialized text by deliberate choice). Those are explicit mapping decisions, not blockers or application-model exceptions. No schema field depends on a SQLite-specific affinity, `rowid`, or SQLite SQL feature.

## Mock to real provider swap path

1. Keep the `DataProvider` contract and normalized metric shape as the stable downstream boundary.
2. For each provider, implement a real adapter alongside its mock adapter: Shopify commerce, Meta and Google Ads campaign metrics, Klaviyo lifecycle metrics, Gorgias support metrics, and inventory/fulfillment quantities.
3. Obtain least-privilege client access, store credentials in a production secrets manager, and retain only a secure reference in `data_connections.credentials_ref`; never place provider secrets in the database rows or source code.
4. Map each provider's API response to the existing normalized metric keys, units, entity types, and IDs; validate the result with Zod before ingestion.
5. Use incremental sync windows, provider rate-limit handling, retry/error recording in `sync_runs`, and idempotent writes before enabling scheduled production runs.
6. Run mock and real adapters in parallel during validation, reconcile source totals and dates, then tune rule thresholds and targets using the client's own baselines.

The comparison engine, rules, anomaly detection, prioritization, evidence references, AI grounding, and UI consume normalized rows, so they do not need a provider-specific rewrite.

### Scheduling the daily brief

A deployment can wire either `npm run brief:generate` (`scripts/brief-generate.ts`, for a given date and defaulting to today) or `POST /api/brief/generate` to a scheduler. The API endpoint is the intended future target for a hosted cron service or OS-level scheduler on a fixed schedule; a GitHub Actions scheduled workflow can invoke an appropriate secured deployment entry point as well. Both entry points generate the brief and simulate its delivery log. This application intentionally uses **no long-running daemon process**, worker, or queue.
