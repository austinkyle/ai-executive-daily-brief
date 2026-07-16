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

## Open items
- Exact `metric_key` taxonomy per domain not yet finalized — do this at the start of Phase 3 and record it in `docs/data-model.md` §5.
- Nothing implemented yet — this workspace starts in Phase 3 (`workflows/03-data-analytics.md`), after Phase 2's schema exists.
