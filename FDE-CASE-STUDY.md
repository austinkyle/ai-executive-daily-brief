# Executive Daily Brief — FDE case study

## Evidence boundary

A local portfolio MVP for fictional Northbound Supply Co. The 30-day dataset, six source connections, nine scenario conditions, and delivery records are simulated. Code and test sources were inspected October 5, 2026; this cleanup did not rerun the application suite. No client shadowing, live-source deployment, or measured ROI is asserted.

## 1. Observe: workflow and constraint

**Modeled workflow:** an operator opens commerce, advertising, lifecycle, support, and inventory dashboards, reconciles changes, and prepares a morning decision brief. Information is spread across tools and cross-domain signals can be missed.

**Discovery still required:** watch a real reporting session; document the exports, definitions, timezone/attribution differences, reconciliation work, report recipients, decision owners, and time spent. Collect past incidents and the actions actually taken. The repository supplies a scenario, not those observations.

## 2. Route: software, AI, human

| Work | Owner | Evidence / reason |
| --- | --- | --- |
| Normalize data, calculate comparisons, apply rules and prioritize findings | Software | Repeatable calculations in [analytics](src/lib/analytics/compare.ts), [rules](src/lib/intelligence/rules.ts), and [prioritization](src/lib/intelligence/prioritize.ts). |
| Explain the supplied findings | Optional AI | [Narrator boundary](src/lib/ai/llm-client.ts) receives structured findings, not permission to discover new facts. |
| Produce a brief without an AI key or after repeated invalid output | Software | [Fallback templates](src/lib/ai/fallback-templates.ts) keep the core path usable. |
| Decide whether to change spend, inventory, or support operations | Human | Briefs recommend investigation; there is no autonomous business-action executor. |

## 3. Design for failure

| Failure | Implemented response | Limit |
| --- | --- | --- |
| No model key | Supported deterministic narrator | Template quality still requires operator review. |
| Invalid schema or unknown finding IDs | Retry with feedback, then fallback in [generation](src/lib/ai/generate.ts) | Schema/ID validation does not prove each sentence follows from evidence. |
| Missing, delayed, or conflicting business-source data | Demo sync/metric records and evidence references make data inspectable | Real connectors, stale-data escalation, and source reconciliation remain future implementation. |
| Delivery outage | Only simulated delivery rows exist | A simulated `sent` record does not prove email or Slack delivery. |

## 4. Verify: engineering versus business acceptance

[Demo-condition tests](src/lib/intelligence/demo-conditions.test.ts) cover the seeded scenarios. [Schema tests](src/lib/ai/schema.test.ts), [generation tests](src/lib/ai/generate.test.ts), and [comparison tests](src/lib/analytics/compare.test.ts) exercise the technical contract. The README lists the commands to run locally; no new test-pass count is claimed here.

For a real engagement, build a permission-approved historical set that includes ordinary days, promotions, delayed data, stockouts, refunds, and support spikes. Reconcile computed metrics with source records and have operators label actionable versus noisy findings. Measure missed material events, false alerts, narrative support, and review time. Agree on acceptance criteria first and use the [shadow-validation approach](docs/consulting-implementation.md) before rollout.

## 5. Measure business value

The existing [ROI model](docs/roi-model.md) is an assumptions worksheet. It separates reporting time/capacity from revenue and stockout exposure and warns against double counting. Its defaults are not measured results.

Baseline the reporting routine and incident-detection delay for two to four weeks. During a comparable trial, measure review time, accepted findings, action follow-through, detection improvement, false-alert burden, and operating cost. Financial exposure is not booked savings; realized savings require evidence of an actual cost reduction or attributable outcome.

## Architecture choice, adoption, and next work

A modular monolith with SQLite avoids queues and microservices for a single-org local demo. Provider boundaries permit replacing mocks without rebuilding the analytics/narrator separation. Introduce production auth, database capacity, a real scheduler, and real delivery only when the operating workflow requires them.

The intended adoption is a brief reviewed in the operator's existing morning routine. No actual adoption is demonstrated. Next: one real workflow baseline, reconciled historical examples, narrative entailment review, a shadow trial, and an observed business outcome.
