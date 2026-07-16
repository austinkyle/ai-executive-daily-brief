# Data Model

Status: outline stub, written in Workflow 01. Full column-level detail (types, constraints, indexes) lands in Phase 2 once the Drizzle schema is implemented — this stub is the authoritative *conceptual* model until then.

## Outline

1. **Entity list and purpose** — organizations, users, memberships, data_connections, sync_runs, metrics, targets, findings, briefs, deliveries. See `implementation-roadmap.md` §3 for the current table-by-table summary.
2. **Relationships** — org is the tenant root; everything else hangs off `org_id`. `metrics` and `findings` are date-scoped facts; `briefs` reference `findings` by ID via `evidence_finding_refs` (enforced, not just conventional — see `ai-safety-and-grounding.md`).
3. **The `metrics` table's generic shape** — one normalized fact table (`domain`, `metric_key`, `entity_type`, `entity_id`, `value`, `unit`) rather than one table per domain. Rationale: keeps the comparison engine domain-agnostic (same `dayOverDay`/`trailing7Avg` functions work for a commerce metric or a support metric), at the cost of losing per-domain column typing — acceptable since Zod validates metric shape at the adapter boundary before insert.
4. **Why comparisons aren't a persisted table** — see `implementation-roadmap.md` §3. Pure functions over `metrics`/`targets`, not cached rows.
5. **Metric key taxonomy** — the specific `metric_key` values per domain (e.g., commerce: `gross_sales`, `net_sales`, `orders`, `aov`, `refunds`; marketing: `spend`, `attributed_revenue`, `roas`, `cpa`, `ctr`; etc.) will be finalized and documented here in Phase 3 when the mock providers are built, since the exact keys are an implementation detail of that workflow.
6. **Postgres portability notes** — column type choices made to keep the SQLite schema swappable (see `architecture.md` §4).

To be completed in Phase 2 (schema implementation) and Phase 3 (metric taxonomy).
