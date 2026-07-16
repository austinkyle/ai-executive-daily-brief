# Workflow 03 — Data & Analytics (GPT 5.6 Terra)

Context: CLAUDE.md + workspaces/analytics/context.md + workspaces/intelligence/context.md + docs/demo-scenario.md.

Implement:
1. **Provider contract**: `DataProvider` interface (`fetchDailyMetrics(orgId, date)` → normalized domain metrics). One mock provider per domain: shopify-mock, meta-mock, google-ads-mock, klaviyo-mock, gorgias-mock, inventory-mock. Each reads from the seeded scenario generator — a single deterministic engine that produces 30+ days of causally coherent data encoding the 9 scripted conditions (revenue down w/ stable traffic, Meta CPA rising, one campaign collapsing, top-SKU stockout approaching, refunds rising on one SKU, shipping-complaint spike, strong Klaviyo flows, returning-customer trend, one clear opportunity).
2. **Ingestion + normalization**: sync run per provider per day → metrics table (metric_key, domain, entity, date, value).
3. **Comparison engine**: DoD, same-weekday WoW, trailing 7-day avg, MTD vs target. Pure functions, fully tested.
4. **Rule engine**: declarative threshold rules producing findings (severity: critical/warning/opportunity/info; each with what-changed, why-it-matters, evidence metric refs, confidence).
5. **Anomaly scoring**: simple z-score vs trailing window; flag |z| > 2.
6. **Cross-domain rules**: at minimum the PRD examples (conversion issue, spend outpacing revenue, refund↔SKU, tickets↔shipping).
7. **Finding prioritization**: deterministic ranking (severity × magnitude × confidence).
8. Tests proving every scripted demo condition is detected. This is the core test suite — be thorough here.

Ritual per CLAUDE.md. Update both workspace context.md files.
