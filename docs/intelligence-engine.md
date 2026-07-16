# Intelligence Engine

Status: complete as of Phase 3 (`workflows/03-data-analytics.md`). This document describes the actual implementation in `src/lib/intelligence/` and `src/lib/analytics/compare.ts`.

## 1. Pipeline stages

```
metrics rows (from `src/lib/db`)
        │  groupMetricsIntoSeries()          — src/lib/intelligence/group-metrics.ts
        ▼
MetricSeriesGroup[]                          — {domain, metricKey, entityType, entityId, unit, points}
        │
        ├─ evaluateRules(PRODUCTION_RULES, groups, asOfDate)   — src/lib/intelligence/rules.ts
        ├─ detectAnomalies(groups, asOfDate)                   — src/lib/intelligence/anomaly.ts
        └─ evaluateCrossDomainRules(groups, asOfDate)          — src/lib/intelligence/cross-domain.ts
        ▼
FindingDraft[]  (ruleId, domain, entityType, entityId, severity, title, whatChanged,
                 whyItMatters, recommendedNextStep, confidence, magnitude, evidenceMetricIds, date)
        ▼
prioritizeFindings(drafts)                   — src/lib/intelligence/prioritize.ts
        ▼
persistFindings(db, orgId, drafts)           — src/lib/intelligence/findings.ts → `findings` table
```

Every stage is a pure function over `MetricSeriesGroup[]` except ingestion (writes `metrics`/`sync_runs`) and `persistFindings` (writes `findings`). `evidenceMetricIds` always carries real `metrics.id` values traced back through the comparison window, satisfying CLAUDE.md's non-negotiable that every finding maps to real evidence.

## 2. Comparison engine (`src/lib/analytics/compare.ts`)

All functions take `{date: string; value: number}[]`, sort a local copy ascending first (dates are lexically sortable `YYYY-MM-DD`), and use a shared `addDays` UTC helper — no wall-clock dependency, fully deterministic.

- `dayOverDay(series, targetDate)` — value at `targetDate` vs `targetDate - 1`. Nulls if either day is missing from the series (missing ≠ 0).
- `sameWeekdayWoW(series, targetDate)` — same shape, `targetDate - 7`.
- `trailing7Avg(series, targetDate, { excludeCurrent? })` — average over the trailing 7-day window, only counting days actually present (`daysIncluded`). `excludeCurrent: true` shifts the window to end the day *before* `targetDate` — used by anomaly scoring so a point never contaminates its own baseline.
- `targetVariance(actual, target)` — absolute/percent variance vs a fixed target (MTD-vs-target use case); `percentVariance` is null when `target === 0`.
- `windowTrend(series, windowDays)` — average of the first `windowDays` points vs the last `windowDays` points of the (sorted) series. This is the workhorse for "has this metric trended over the full window / late window" questions (conditions 2, 5, 6, 7 all use it via rules; overlap between the two windows on short series is allowed, not guarded against).

## 3. Rule engine (`src/lib/intelligence/rules.ts`)

Declarative `ThresholdRule` objects: `{ id, domain, metricKey, entityType, comparisonType: "latestValue"|"dayOverDay"|"sameWeekdayWoW"|"windowTrend", windowDays?, operator: "gt"|"lt", threshold, severity, confidence, title/whatChanged/whyItMatters/recommendedNextStep: (ctx) => string }`. `evaluateRules` runs every rule against every matching `MetricSeriesGroup` (matched by `domain` + `metricKey` + `entityType`) as of a given date, and skips gracefully (no throw) when the required comparison data isn't available.

`PRODUCTION_RULES` (6 rules):

| id | domain / metricKey / entityType | comparison | operator | threshold | severity | Demo condition |
|---|---|---|---|---|---|---|
| `cpa-drift` | marketing / cpa / campaign | windowTrend(7) | gt | 0.25 | warning | #2 — Meta CPA drifting up |
| `stockout-risk` | inventory / days_of_inventory / sku | latestValue | lt | 7 | critical | #4 — stockout risk |
| `refund-rate-spike` | commerce / refund_rate / sku | windowTrend(10) | gt | 1.0 | warning | #5 — refunds rising on one SKU |
| `shipping-tickets-spike` | support / ticket_count / contact_reason | windowTrend(10) | gt | 0.5 | warning | #6 — shipping complaints spike |
| `flow-revenue-growth` | email / flow_revenue / flow | windowTrend(7) | gt | 0.3 | opportunity | #7 — Klaviyo flows strong |
| `underinvested-high-roas-campaign` | marketing / roas / campaign | latestValue | gt | 5.5 | opportunity | #9 — underinvested opportunity |

## 4. Anomaly scoring (`src/lib/intelligence/anomaly.ts`)

`computeZScore(points, targetDate, windowDays = 7)` computes the sample mean/stdDev over the `windowDays` points immediately preceding the target date (by array position after sorting, not calendar-gap-filled), then `zScore = (targetValue - mean) / stdDev`. Returns `null` if fewer than 2 baseline points exist or `stdDev === 0` (a flat baseline makes any deviation trivially "infinite" — treated as undecidable rather than a guaranteed anomaly).

`detectAnomalies(groups, asOfDate, { windowDays = 7, zThreshold = 2 } = {})` flags every group where `|zScore| > zThreshold`, producing a `ruleId: "anomaly-zscore"`, `severity: "critical"` finding with `confidence = min(|zScore| / 4, 1)`. This is what catches demo condition #3 (`meta-prospecting-bestseller`'s sharp CPA/ROAS collapse in the final 9 days) — a sudden isolated break, not a gradual threshold crossing, so a fixed threshold rule would either fire too early or miss the shape entirely. **Why `|z| > 2`**: ~2 standard deviations flags roughly the top 5% of deviations under a normal-ish trailing baseline — tight enough to catch a genuine break, loose enough to tolerate the ~3% multiplicative noise baked into every other metric in the scenario.

## 5. Cross-domain rules (`src/lib/intelligence/cross-domain.ts`)

Four composite detectors, scoped exactly to the PRD's named examples (not a general correlation engine — see `workspaces/intelligence/context.md`):

- **`conversion-issue`** — org-level `sessions` flat (±5%) + `conversion_rate` down ≥10% (7-day windowTrend) + `new_customer_revenue` down ≥10% + `returning_customer_revenue` resilient (≥ −5%). Ties demo conditions #1 and #8 together: traffic-flat-but-conversion-down is only a clean "on-site/new-visitor experience" story once the new/returning split confirms the decline isn't a retention problem.
- **`spend-outpacing-revenue`** — blended `spend` across all marketing campaigns up ≥10% (7-day windowTrend) while blended `attributed_revenue` is down at all. Aggregates by summing same-date points across every `campaign` group before running `windowTrend`.
- **`refund-sku-isolation`** — one SKU's `refund_rate` windowTrend(10) > 1.0 (matches `refund-rate-spike`'s threshold) AND at least one other SKU stays flat (≤30% change) — confirms the spike is product-specific, not a storewide return-policy shift.
- **`tickets-shipping-inventory`** — `shipping_delay` ticket_count windowTrend(10) > 0.5 (matches `shipping-tickets-spike`'s threshold) AND some inventory SKU's latest `days_of_inventory` < 10 — ties demo condition #6 to condition #4's stockout pressure (the scenario times these to overlap intentionally).

`refund-sku-isolation` and `tickets-shipping-inventory` deliberately overlap with `refund-rate-spike`/`shipping-tickets-spike` in the single-metric rule engine — the demo-conditions test suite accepts either firing as proof of detection (see §7), since in production both a single-metric alert and its cross-domain corroboration are useful, not redundant.

## 6. Finding prioritization (`src/lib/intelligence/prioritize.ts`)

```
score = SEVERITY_WEIGHT[severity] × magnitude × confidence
SEVERITY_WEIGHT = { critical: 4, warning: 3, opportunity: 2, info: 1 }
```

`magnitude` is set per-detector at finding-creation time: `|percentChange|` for windowTrend-based rules and cross-domain detectors, a relative-distance-from-threshold ratio for `latestValue` rules, and `|zScore|` for anomaly findings — always non-negative, always in the same rough order of magnitude as "how far past the line this is." `prioritizeFindings` maps every draft to `{...draft, score}` and sorts descending; ties keep their original relative order (stable sort) since no secondary tie-break was specified as a requirement.

## 7. Test coverage

| Demo condition (`docs/demo-scenario.md`) | Proven by | Test |
|---|---|---|
| #1 Revenue down / traffic flat | `conversion-issue` cross-domain finding | `demo-conditions.test.ts` "condition 1" |
| #2 Meta CPA drifting up | `cpa-drift` rule finding on `meta-retargeting-core` | `demo-conditions.test.ts` "condition 2" |
| #3 One campaign collapsing | `anomaly-zscore` finding on `meta-prospecting-bestseller`, scanned across days 21–29 (at least one day must flag — avoids a borderline single-day assertion) | `demo-conditions.test.ts` "condition 3" |
| #4 Stockout risk | `stockout-risk` rule finding on `trailhead-35l-pack`, severity critical | `demo-conditions.test.ts` "condition 4" |
| #5 Refunds rising on one SKU | `refund-rate-spike` rule OR `refund-sku-isolation` cross-domain finding on `glacier-bottle-24oz` | `demo-conditions.test.ts` "condition 5" |
| #6 Shipping complaints spike | `shipping-tickets-spike` rule OR `tickets-shipping-inventory` cross-domain finding on `shipping_delay` | `demo-conditions.test.ts` "condition 6" |
| #7 Klaviyo flows strong | `flow-revenue-growth` rule finding on both `abandoned_cart` and `welcome_series` | `demo-conditions.test.ts` "condition 7" |
| #8 Returning-customer revenue resilient | direct `windowTrend` assertion on `returning_customer_revenue` vs `new_customer_revenue` (data-shape check underpinning condition #1's cross-domain finding, not a standalone rule) | `demo-conditions.test.ts` "condition 8" |
| #9 Opportunity (underinvested high-ROAS campaign) | `underinvested-high-roas-campaign` rule finding on `meta-prospecting-ridgeline` | `demo-conditions.test.ts` "condition 9" |

`demo-conditions.test.ts` ingests all 30 scenario days through all 6 mock providers into a single in-memory org (`createTestDb()`, never touching `data/app.db`), groups the resulting `metrics` rows via `groupMetricsIntoSeries`, and runs the real `evaluateRules`/`detectAnomalies`/`evaluateCrossDomainRules` functions — this is a full-pipeline integration test, not unit fixtures. A 10th test asserts the grouping step itself produced non-empty, non-duplicated series.

Unit-level coverage: `compare.test.ts` (10 cases), `scenario-generator.test.ts` (6, incl. determinism), `providers.test.ts` (8), `ingest.test.ts` (3), `rules.test.ts`, `anomaly.test.ts` (4), `cross-domain.test.ts` (9), `prioritize.test.ts` (3), `findings.test.ts` (4). Full Phase 3 suite: 11 test files, 64 tests, all passing, well under the 60s budget.
