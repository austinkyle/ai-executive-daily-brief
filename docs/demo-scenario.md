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

## 5-Minute Walkthrough

Before presenting, run the following commands (skip the seed command only if the database is already seeded):

```bash
npm run db:seed
npm run dev
```

1. **Today's Brief:** Open `http://localhost:3000` and say, “Northbound's daily brief starts with the few decisions leadership should make today,” while pointing to the executive summary, status, and evidence-linked priorities.
2. **Generate:** Click **Generate Today's Brief** and say, “This runs the same deterministic findings-to-narrative path on demand, with a no-key fallback available,” while pointing to the refreshed generated brief and its Print link.
3. **Scorecard:** Open `/scorecard` and say, “The narrative is backed by daily, weekly, and trailing comparisons rather than a black-box conclusion,” while pointing to the commerce, marketing, support, and inventory deltas.
4. **Alerts:** Open `/alerts` and say, “Condition #3, *One campaign deteriorating sharply*, is isolated to Prospecting – Bestseller Bundle rather than treated as a vague paid-media problem,” while pointing to its severity, change, evidence, and next step.
5. **Alerts, continued:** Say, “Condition #4, *Top product approaching stockout*, is a separate inventory risk on the best-selling pack,” while pointing to the critical stockout alert; if visible, note that condition #6 shipping-delay complaints can corroborate fulfillment pressure rather than prove causation alone.
6. **History:** Open `/history` and say, “Generated briefs persist as a reviewable decision record instead of disappearing into a chat response,” while pointing to dated historical entries.
7. **Data Sources:** Open `/sources` and say, “The demo makes its data provenance visible across six simulated connections,” while pointing to Shopify, Meta, Google Ads, Klaviyo, Gorgias, inventory, and their sync status.
8. **Print view:** Follow the Print link to `/brief/[id]/print` and say, “A clean meeting-ready brief can be printed or saved as PDF directly by the browser,” while pointing to **Print / Save as PDF** and clarifying no server-side PDF or real email/Slack delivery is claimed.
