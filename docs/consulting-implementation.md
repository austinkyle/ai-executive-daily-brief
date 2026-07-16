# Consulting Implementation Guide

Status: outline stub, written in Workflow 01. Full detail lands in Phase 6 (`workflows/06-delivery-docs.md`), which owns this document. This doc explains how this system's architecture would actually be deployed for a real DTC client — it's the bridge from portfolio artifact to consulting engagement.

## Outline

1. **Discovery** — what to learn about a prospective client in the first conversation: their current reporting process (who assembles what, how long it takes), their tech stack (which of Shopify/Meta/Google/Klaviyo/Gorgias/GA4/inventory system they actually run), and what decisions they're currently making late or blind.
2. **Data access** — how each real provider's API/auth would replace the corresponding mock adapter (`DataProvider` interface unchanged), what access scopes are needed, typical data-access lead time per platform.
3. **KPI definition** — working with the client to set real thresholds/targets (the demo's rule engine thresholds are illustrative, not universal — a $3M brand and a $50M brand have different "material" swings).
4. **Implementation** — sequencing a real deployment: connect 1–2 highest-value sources first (commerce + paid usually), validate findings against the client's own intuition before adding more sources.
5. **Validation** — running the system in shadow/parallel against the client's existing reporting for a period before they trust it as the source of truth; how to catch false positives/negatives in the rule engine during this window.
6. **Adoption** — getting the brief into the founder's actual morning routine (delivery channel choice, timing, who else on the team should see it).
7. **Optimization** — tuning thresholds and cross-domain rules over time as the engine's track record builds trust; when to add new data domains.
8. **ROI framing for a real engagement** — reference `implementation-roadmap.md`/README's ROI framework; adapt the assumptions (hours saved, stockout exposure, wasted spend detection speed) to the specific client's numbers rather than the demo's illustrative ones.

To be completed in Phase 6.
