# Data Model

Status: complete as of Phase 3. Column-level detail lives in `src/lib/db/schema.ts` (Phase 2); the metric key taxonomy (§5) was finalized in Phase 3 alongside the scenario generator and mock providers that produce it.

## Outline

1. **Entity list and purpose** — organizations, users, memberships, data_connections, sync_runs, metrics, targets, findings, briefs, deliveries. See `implementation-roadmap.md` §3 for the current table-by-table summary.
2. **Relationships** — org is the tenant root; everything else hangs off `org_id`. `metrics` and `findings` are date-scoped facts; `briefs` reference `findings` by ID via `evidence_finding_refs` (enforced, not just conventional — see `ai-safety-and-grounding.md`).
3. **The `metrics` table's generic shape** — one normalized fact table (`domain`, `metric_key`, `entity_type`, `entity_id`, `value`, `unit`) rather than one table per domain. Rationale: keeps the comparison engine domain-agnostic (same `dayOverDay`/`trailing7Avg` functions work for a commerce metric or a support metric), at the cost of losing per-domain column typing — acceptable since Zod validates metric shape at the adapter boundary before insert.
4. **Why comparisons aren't a persisted table** — see `implementation-roadmap.md` §3. Pure functions over `metrics`/`targets`, not cached rows.
5. **Metric key taxonomy** — finalized in Phase 3 (`workflows/03-data-analytics.md`). One normalized `metrics` fact table serves every domain below; `entity_id` values are the literal strings the scenario generator and mock providers use, so they double as test fixtures.

| Domain | `metric_key` | `entity_type` | `entity_id` examples | `unit` |
|---|---|---|---|---|
| commerce | `sessions`, `orders`, `conversion_rate`, `gross_sales`, `aov`, `new_customer_revenue`, `returning_customer_revenue` | `org` | `org` | count / ratio / currency |
| commerce | `units_sold`, `refund_rate`, `refunds_amount` | `sku` | `trailhead-35l-pack`, `glacier-bottle-24oz`, `ridgeline-multitool` | count / ratio / currency |
| marketing | `spend`, `attributed_revenue`, `roas`, `cpa`, `ctr` | `campaign` | `meta-retargeting-core`, `meta-prospecting-bestseller`, `meta-prospecting-ridgeline`, `google-branded-search` | currency / ratio / currency |
| inventory | `units_on_hand`, `days_of_inventory` | `sku` | `trailhead-35l-pack` (only SKU tracked in inventory for the MVP) | count / days |
| email | `flow_revenue`, `open_rate`, `click_rate` | `flow` | `abandoned_cart`, `welcome_series` | currency / ratio |
| support | `ticket_count` | `contact_reason` | `shipping_delay`, `product_question`, `other` | count |

Provider→domain mapping (six mock adapters, each a thin filter over the shared scenario generator): `shopify` → all `commerce` rows (org + sku), `meta` → `marketing` rows where `entity_id` starts with `meta-`, `google-ads` → `marketing` rows where `entity_id === "google-branded-search"`, `klaviyo` → all `email` rows, `gorgias` → all `support` rows, `inventory` → all `inventory` rows.

6. **Postgres portability notes** — column type choices made to keep the SQLite schema swappable (see `architecture.md` §4).

Phase 2 (schema implementation) and Phase 3 (metric taxonomy) are both complete.
