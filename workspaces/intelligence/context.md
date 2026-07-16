# intelligence workspace context

## Domain scope
Owns turning normalized metrics + comparisons into ranked, evidence-backed findings: the rule engine, anomaly scoring, cross-domain rules, and finding prioritization. Consumes the `analytics` workspace's comparison functions; does not compute metrics itself and does not write narrative (that's `ai`).

## Key files planned
- `src/lib/intelligence/rules.ts` — declarative threshold rule definitions (metric_key, comparison type, operator, threshold → finding template).
- `src/lib/intelligence/anomaly.ts` — z-score vs trailing window, flags `|z| > 2`.
- `src/lib/intelligence/cross-domain.ts` — composite rules for the PRD's named examples: revenue-down + traffic-flat → conversion issue; spend growth outpacing revenue growth; refund spike tied to one SKU; ticket spike with shipping contact reason.
- `src/lib/intelligence/prioritize.ts` — deterministic scoring: severity-weight × magnitude × confidence → ranked `findings`.
- `src/lib/intelligence/findings.ts` — persistence of `findings` rows (what-changed, why-it-matters, evidence_metric_refs, confidence, recommended_next_step).

## Interfaces owned
- `Finding` shape (the schema the `ai` workspace consumes as its ONLY input — never raw metrics).
- The prioritization scoring formula, since the `ai` workspace and the Alerts UI both need consistent top-N ordering.

## Decisions from Workflow 01
- Cross-domain rule coverage is capped at the PRD's explicitly named examples (conversion issue, spend-outpacing-revenue, refund↔SKU, tickets↔shipping) — not a general correlation engine. Do not expand scope here without a new decision logged.
- Anomaly threshold: `|z| > 2` on a trailing window (exact window length to be fixed in Phase 3 and documented in `docs/intelligence-engine.md`).

## Phase 3 — done (Workflow 03, FabTerra: Fable orchestrator + GPT-5.6 Terra worker)

### Files touched
- `src/lib/intelligence/types.ts` — `MetricPoint`, `MetricSeriesGroup`, `Severity`, `FindingDraft` (the shared vocabulary every other file in this workspace consumes/produces).
- `src/lib/intelligence/group-metrics.ts` — `groupMetricsIntoSeries(rows)`, the missing link turning ingested `metrics` rows into `MetricSeriesGroup[]`; identified as an open gap during planning and built as part of Task 7, not a separate task, since nothing else needed it until the full-pipeline test.
- `src/lib/intelligence/rules.ts` — `ThresholdRule`, `evaluateRules`, `PRODUCTION_RULES` (6 rules; full list + thresholds in `docs/intelligence-engine.md` §3).
- `src/lib/intelligence/anomaly.ts` — `computeZScore`, `detectAnomalies`, `|z| > 2` on a trailing 7-day window excluding the target day.
- `src/lib/intelligence/cross-domain.ts` — the 4 PRD-named composite detectors + `evaluateCrossDomainRules` (full trigger conditions in `docs/intelligence-engine.md` §5).
- `src/lib/intelligence/prioritize.ts` — `SEVERITY_WEIGHT`, `scoreFinding`, `prioritizeFindings` (`score = severityWeight × magnitude × confidence`, stable sort, no secondary tie-break).
- `src/lib/intelligence/findings.ts` — `persistFindings(db, orgId, drafts)`, batched insert into `findings` with `evidenceMetricRefs`/`score` populated; empty-array input short-circuits before insert (Drizzle throws on an empty `.values([])`).
- `src/lib/intelligence/demo-conditions.test.ts` — the priority deliverable: full pipeline (all 6 providers × 30 days → ingest → group → rules/anomaly/cross-domain) run against one in-memory org, one test per scripted condition. All 9 conditions + a grouping-sanity check pass. Full mapping of condition → rule/finding in `docs/intelligence-engine.md` §7.

### Decisions made
- Conditions #5 and #6 each have two independent detectors that can prove them (a single-metric `ThresholdRule` and a cross-domain composite) — the demo test accepts either firing rather than picking one as canonical, since both are legitimate production signals, not duplicates to be deduplicated away.
- Condition #3 (the sharp campaign collapse) is asserted via a 9-day scan (days 21–29, at least one day must flag), not a single hard-coded day, since the z-score can dip under threshold on some individual late days as the trailing baseline itself absorbs the collapse.
- Condition #8 (returning-customer resilience) is not given its own rule — it's asserted as a direct `windowTrend` data-shape check, since in the scenario it functions as a precondition sharpening condition #1's `conversion-issue` finding, not an independent alert.
- One test-fixture bug was found and fixed during this phase (not a logic bug): `anomaly.test.ts`'s non-detection case originally used baseline numbers that produced a genuine z-score of ~3.8 against its own target value; fixed by adjusting the fixture, not the anomaly logic. Likewise `prioritize.test.ts`'s sort-order test originally had two severities landing on an exact score tie, making its expected order arbitrary; fixed by widening one fixture's magnitude.

### Open items
- None outstanding for Phase 3's scope. `findings.ts` persists `evidenceMetricRefs`/`score`/etc. but the `findings` table schema (locked in Phase 2) has no `entityType`/`entityId`/`ruleId`/`magnitude` columns — those `FindingDraft` fields are dropped at persistence time by design; if a future phase needs them queryable, that's a schema change to raise explicitly, not a Phase 3 gap.
