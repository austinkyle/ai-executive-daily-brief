# Demo Scenario — Northbound Supply Co.

Status: designed in Workflow 01. Generator implementation lands in Phase 3 (`workflows/03-data-analytics.md`).

## The Brand

**Northbound Supply Co.** — a DTC outdoor/EDC (everyday-carry) gear brand: backpacks, insulated bottles, and small hard-goods tools/accessories. Positioned at roughly $8–12M annual revenue, comfortably inside the PRD's $3M–$50M target band. Shopify-based, running Meta + Google paid acquisition, Klaviyo for email/SMS, Gorgias for support, and a simple inventory/fulfillment system — matching the PRD's assumed tech stack exactly.

Why this brand: physical hard-goods with clear SKU identity make stockouts, refunds-per-SKU, and shipping complaints easy to model causally (a bag that's redesigned can plausibly have a refund-rate blip; a bestseller pack can plausibly approach a stockout). A DTC apparel or beauty brand would work too, but SKU-level causal stories are easier to make convincing with durable goods.

## Data Window

30 days, deterministic generation. A seeded PRNG (mulberry32 or equivalent) supplies only **micro-noise** on top of scripted baselines and trend shapes — the macro pattern for every one of the 9 conditions below is authored, not random, so the same seed always reproduces the same story and the same findings.

## The 9 Scripted Conditions

Each maps to a specific rule/anomaly the intelligence engine (Phase 3) must detect, and each must show up as a specific finding in the generated brief (Phase 4).

| # | Condition | Domain(s) | Shape over the 30 days | Expected finding |
|---|---|---|---|---|
| 1 | Revenue down despite steady traffic | Commerce + GA4-style sessions | Sessions flat/normal variance throughout; conversion rate and revenue step down over the final ~6 days | Cross-domain: conversion-issue finding (traffic stable, revenue/CVR down) |
| 2 | Meta CPA increasing | Paid Marketing | Gradual upward drift in CPA across the full 30 days (creative fatigue), not just a recent spike | Threshold/trend finding: CPA trending up, efficiency warning |
| 3 | One campaign deteriorating sharply | Paid Marketing (campaign-level) | A named campaign ("Prospecting – Bestseller Bundle") holds steady for ~3 weeks then collapses (ROAS/CTR drop, CPA spike) in the final week | Campaign-level anomaly, isolated to one entity — prioritized as the main driver of the overall efficiency decline |
| 4 | Top product approaching stockout | Inventory + Commerce | Best-selling pack has strong, consistent sell-through; days-of-inventory steadily declines and crosses a stockout-risk threshold near the end of the window | Inventory finding: stockout risk on a top-revenue SKU |
| 5 | Refunds rising for a particular product | Commerce | A recently-redesigned insulated bottle shows a step-up in refund rate specifically for that SKU, other SKUs unaffected | Product-quality finding, isolated to one SKU |
| 6 | Support complaints increasing around shipping | Support | "Shipping/delay" contact-reason ticket volume spikes in the final ~10 days; other contact reasons stay flat | Support finding; cross-domain link candidate (shipping delays coinciding with fulfillment/inventory pressure) |
| 7 | Klaviyo flow revenue performing strongly | Email/Lifecycle | Abandoned-cart and welcome-series flow revenue grows steadily across the window, open/click rates healthy | Positive finding — offsets weaker paid acquisition, called out as a "what went well" |
| 8 | Returning-customer revenue improving or weakening | Commerce | Returning-customer revenue share holds steady/strong even as new-customer conversion weakens (condition #1) | Cross-domain finding: the revenue softness is concentrated in new-customer acquisition, not retention — sharpens the diagnosis in #1 |
| 9 | A meaningful opportunity | Paid Marketing or Commerce | A smaller, lower-spend campaign (or a newer product line) meaningfully outperforms its spend/forecast throughout the window — under-invested relative to its efficiency | Opportunity finding: reallocation recommendation |

## Causal Coherence Notes

These conditions are written to interact, not sit in isolation, so the generated brief can draw real cross-domain connections instead of listing unrelated facts:

- #1 (revenue/CVR down) + #8 (retention healthy) together produce a single sharper diagnosis: the problem is new-customer acquisition/conversion, not the whole business.
- #2 (CPA drifting up) + #3 (one campaign collapsing) together explain *why* blended marketing efficiency worsens: one campaign is responsible for a disproportionate share of the decline, not a uniform market-wide effect.
- #6 (shipping complaints) is timed to plausibly correlate with fulfillment/inventory pressure from #4 (stockout risk), giving the engine a legitimate cross-domain rule to fire (ticket-reason spike + inventory pressure) rather than a coincidence.
- #7 (strong flow revenue) is explicitly framed as a partial offset to #1/#2/#3, so the brief's "what went well" section isn't disconnected from its "what needs attention" section.
- #5 (refunds on one SKU) and #4 (stockout on a *different* top SKU) are deliberately different products, so the intelligence engine must correctly attribute each finding to the right entity rather than conflating "product problems" into one vague signal.

## Reproducibility

The scenario generator takes a fixed seed constant (defined once in `src/lib/domain` or the seed script itself) and is a pure function of `(day_index) → metrics`. Running `db:seed` twice against a fresh database must produce byte-identical `metrics` rows. No wall-clock time or unseeded `Math.random()` calls are permitted in the generator.

## Demo Walkthrough (5 minutes)

To be expanded in Phase 6 (`workflows/06-delivery-docs.md`) once the UI exists. Planned shape:
1. Cold clone → `npm install` → `npm run db:seed` → `npm run dev`.
2. Open Today's Brief — read the executive summary and the top 2–3 findings.
3. Open Scorecard — show the same underlying numbers with DoD/WoW/7-day-avg deltas.
4. Open Alerts & Opportunities — show the full findings list grouped by severity, expand evidence on one critical and one opportunity finding.
5. Open History — show the brief exists as a persisted, re-viewable record.
6. Open Data Sources — show the 5 simulated connections and their sync status.
7. Regenerate the brief on demand to show the pipeline runs live, not just from a fixture.
