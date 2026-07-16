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

## Open items
- Full rule list and exact thresholds — finalize in Phase 3, document in `docs/intelligence-engine.md`.
- Test suite must prove each of the 9 scripted demo conditions (`docs/demo-scenario.md`) produces its expected finding — this is the core test suite for the whole project; be thorough.
- Nothing implemented yet — starts in Phase 3 (`workflows/03-data-analytics.md`).
