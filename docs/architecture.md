# Architecture

Status: outline stub, written in Workflow 01. Full detail lands progressively as each phase completes, with a final pass in Phase 6.

## Outline

1. **System overview** — modular monolith, single Next.js (App Router) process. No microservices, no separate worker process, no queue. Background-style work (ingestion, brief generation) runs as server actions / API routes / npm scripts, not daemons.
2. **Module map** — `src/lib/domain`, `src/lib/integrations` (provider adapters), `src/lib/analytics` (comparison/rule/anomaly engines), `src/lib/intelligence` (finding prioritization, cross-domain rules), `src/lib/ai` (LLM abstraction, prompt, schema, fallback), `src/lib/notifications` (delivery simulation), `src/lib/db` (Drizzle schema + client). Boundaries and why they replace the PRD's suggested `packages/*` layout — see `implementation-roadmap.md` §2.
3. **Data flow diagram** — provider adapter → ingestion/sync_run → metrics table → comparison engine → rule engine → anomaly scoring → cross-domain rules → prioritization → AI pipeline → briefs table → UI. (To be rendered as an actual diagram once the pipeline is built — see `implementation-roadmap.md` §4–5 for the current textual version.)
4. **SQLite → Postgres swap path** — Drizzle schema uses only Postgres-portable types. Swap = change the Drizzle driver (`better-sqlite3` → `pg`/`postgres.js`), update `DATABASE_PATH`/connection-string env handling, re-run migrations against a Postgres instance. No schema rewrite required. Document exact steps once Phase 2 schema is final.
5. **Mock → real provider swap path** — each mock adapter implements the same `DataProvider` interface (`fetchDailyMetrics(orgId, date)`); a real integration is a new adapter behind the same interface plus real credentials in `data_connections.credentials_ref`. No changes needed downstream of ingestion.
6. **Security posture** — no real auth in the MVP (single implicit demo org/user); `credentials_ref` is a stub since all providers are simulated; where a real secrets vault (KMS/Vault) would sit in a production deployment.
7. **Scaling/observability notes** — intentionally out of scope for a 30-day/1-org demo; note what would need to change for a real multi-tenant deployment (this feeds `consulting-implementation.md`).

To be filled in during/after Phases 2–6, each phase updating the relevant section as it's built.
