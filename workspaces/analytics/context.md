# analytics workspace context

## Domain scope
Owns the deterministic number-crunching layer: provider adapters, the seeded scenario generator, ingestion, normalization, and the comparison engine. Does not own finding generation/scoring (that's `intelligence`) or narrative (that's `ai`) — this workspace turns raw provider output into normalized `metrics` rows and comparable deltas, nothing more.

## Key files planned
- `src/lib/integrations/provider.ts` — `DataProvider` interface: `fetchDailyMetrics(orgId, date) → NormalizedMetric[]`.
- `src/lib/integrations/{shopify,meta,google-ads,klaviyo,gorgias,inventory}-mock.ts` — one adapter per domain, each reading from the scenario generator.
- `src/lib/integrations/scenario-generator.ts` — the single deterministic engine producing 30 days of causally-coherent data encoding all 9 conditions in `docs/demo-scenario.md`. Seeded PRNG (mulberry32 or equivalent) for micro-noise only; macro shape is scripted.
- `src/lib/analytics/ingest.ts` — writes one `sync_run` + `metrics` rows per provider per day.
- `src/lib/analytics/compare.ts` — pure functions: `dayOverDay`, `sameWeekdayWoW`, `trailing7Avg`, `targetVariance`.

## Interfaces owned
- `DataProvider` — the contract every future real integration must implement.
- `NormalizedMetric` shape (domain, metric_key, entity_type, entity_id, value, unit, date) — the vocabulary the rest of the pipeline consumes.
- Comparison function signatures — consumed by both the `intelligence` workspace's rule engine and the `web` workspace's Scorecard view.

## Decisions from Workflow 01
- 6 mock adapters (shopify, meta, google-ads, klaviyo, gorgias, inventory), all reading from one shared scenario generator rather than each having independent random logic — required for the 9 conditions to interact causally (see `docs/demo-scenario.md` "Causal Coherence Notes").
- Demo brand: Northbound Supply Co. (DTC outdoor/EDC gear, ~$8–12M/yr). Full scenario detail in `docs/demo-scenario.md`.
- No persisted comparisons table — comparisons are computed on demand, not cached.

## Phase 3 — done (Workflow 03, FabTerra: Fable orchestrator + GPT-5.6 Terra worker)

### Files touched
- `src/lib/integrations/provider.ts` — `DataProvider`/`NormalizedMetric` contract.
- `src/lib/integrations/scenario-generator.ts` — `generateScenario()`, `dateForDayIndex`/`dayIndexForDate`, `SCENARIO_SEED`, `SCENARIO_START_DATE = "2026-06-17"` (day 29 = 2026-07-16, today). Reuses `src/lib/util/prng.ts` (mulberry32) — no second PRNG added.
- `src/lib/integrations/{shopify,meta,google-ads,klaviyo,gorgias,inventory}-mock.ts` — thin domain/entity filters over the generator.
- `src/lib/analytics/ingest.ts` — `ingestProviderDay`/`ingestProvidersForDates`, one `sync_run` + N `metrics` rows per provider/day, transactional.
- `src/lib/analytics/compare.ts` — `dayOverDay`, `sameWeekdayWoW`, `trailing7Avg` (with `excludeCurrent`), `targetVariance`, `windowTrend`.
- `src/lib/db/test-db.ts` — `createTestDb()`, in-memory SQLite harness (raw `CREATE TABLE` mirroring `schema.ts`), reused by every Phase 3 test suite and by `intelligence`'s `findings.test.ts`/`demo-conditions.test.ts` — never touches `data/app.db`.

### Decisions made
- Metric key taxonomy finalized and documented in `docs/data-model.md` §5 (this was this workspace's open item from Workflow 01).
- `createTestDb()` lives in `src/lib/db/` (not `analytics/`) since it's a cross-workspace test utility — deliberate placement so `intelligence` could reuse it without a circular workspace dependency.

### Open items
- `src/lib/db/seed.ts` still only creates 5 `data_connections` (no "inventory" connection) — a pre-existing gap, deliberately not fixed here since this phase never touched the real seeded DB. Flagged in `docs/implementation-roadmap.md` Phase 3 for whichever phase first ingests against `data/app.db`.
