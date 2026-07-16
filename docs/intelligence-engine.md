# Intelligence Engine

Status: outline stub, written in Workflow 01. Full detail (actual rule definitions, thresholds, scoring formula) lands in Phase 3 (`workflows/03-data-analytics.md`), which owns this document.

## Outline

1. **Pipeline stages** — comparison engine → rule engine → anomaly scoring → cross-domain rules → finding prioritization. See `implementation-roadmap.md` §4 for the current stage-by-stage description.
2. **Comparison engine** — pure function signatures (`dayOverDay`, `sameWeekdayWoW`, `trailing7Avg`, `targetVariance`), inputs/outputs, edge cases (missing prior-period data, first-week-of-history behavior).
3. **Rule engine** — the declarative rule format (metric_key, comparison type, operator, threshold → finding template), and the full list of rules once implemented.
4. **Anomaly scoring** — z-score method, the trailing-window length choice, the `|z| > 2` threshold and why that value.
5. **Cross-domain rules** — the specific composite rules implemented for the PRD's named examples (conversion issue, spend-outpacing-revenue, refund↔SKU, tickets↔shipping), with their exact trigger conditions.
6. **Finding prioritization** — the deterministic scoring formula (severity-weight × magnitude × confidence) and tie-breaking rules.
7. **Test coverage** — how each of the demo scenario's 9 scripted conditions (`demo-scenario.md`) is proven detected by a specific test.

To be completed in Phase 3.
