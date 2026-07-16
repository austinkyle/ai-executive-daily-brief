# Implementation Roadmap

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

Last updated: 2026-07-16 (Workflow 01 — Plan & Architecture)

---

## 1. Product Objective & MVP Boundary

**Objective**: collect what a Shopify DTC founder needs from commerce, paid marketing, email/lifecycle, support, and inventory systems, and produce a daily, decision-ready executive brief — deterministic analytics feeding a grounded LLM narrative, never an LLM freely mining raw data. The system should read like an AI chief of staff, not a dashboard.

**In scope for the MVP**:
- One seeded fictional org ("Northbound Supply Co."), 30 days of causally-coherent simulated data, 6 provider adapters (mock only): Shopify, Meta Ads, Google Ads, Klaviyo, Gorgias, Inventory.
- Full deterministic pipeline: ingest → normalize → compare → rule-engine findings → anomaly scores → prioritization.
- AI narrative layer with schema validation, evidence enforcement, and a genuinely good no-API-key fallback.
- Five UI views: Today's Brief, Scorecard, Alerts & Opportunities, History, Data Sources.
- On-demand brief generation + one delivery mechanism (printable view + simulated email/Slack delivery log).
- Portfolio-grade documentation, an editable ROI framework, and tests on core business logic.

**Explicitly out of scope**: real provider integrations, real auth/login flow, encrypted secret storage beyond a documented stub, Postgres/Docker, background daemons/cron (a documented schedule path + a script instead), multi-org UI switching.

## 2. Stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router), TypeScript strict | Single app, no monorepo tooling |
| Styling | Tailwind CSS | Hand-rolled SVG charts, no chart library |
| Database | SQLite (`better-sqlite3`) via Drizzle | **Deviation from PRD default** (Postgres/Docker) — see below |
| Validation | Zod | All boundaries: env, LLM I/O, API routes |
| Testing | Vitest | Target: full suite < 60s |
| Package manager | npm | No heavy deps (no puppeteer, no chart libs >100KB) |
| LLM | OpenAI-compatible client via raw `fetch` | No SDK dependency; deterministic fallback when no key |

**Why SQLite instead of the PRD's Postgres/Docker default**: the PRD's own "Technical Direction" section contains an explicit override — *"Prioritize a light local footprint — SQLite instead of Postgres, no Docker, single app process... CLAUDE.md wins on any conflict."* `CLAUDE.md`'s Resource Budget makes the same call for the same reason (the user's machine, not token spend, is the constraint). Drizzle's schema is kept Postgres-portable (no SQLite-only column types) specifically so this is a low-effort swap later — see `architecture.md` for the swap path.

**Why `src/lib/*` modules instead of a `packages/*` monorepo**: the PRD's suggested structure is a multi-package workspace, but for a single Next.js app that adds workspace-tooling overhead (separate `package.json`s, build ordering, cross-package type resolution) with no real benefit at this scale. Clear module boundaries (`src/lib/domain`, `src/lib/integrations`, `src/lib/analytics`, `src/lib/intelligence`, `src/lib/ai`, `src/lib/notifications`) give the same separation of concerns without it. If this ever splits into a real multi-package product, the module boundaries are already the package boundaries.

## 3. Core Data Model

All tables live in one Drizzle schema, SQLite-backed, using only Postgres-portable column types (text/integer/real/json-as-text — no SQLite-specific affinities).

| Table | Purpose | Key columns |
|---|---|---|
| `organizations` | Tenant root | id, name, created_at |
| `users` | Account holders | id, email, name, created_at |
| `memberships` | User↔org, shape-only (no auth flow built) | id, org_id, user_id, role |
| `data_connections` | One row per provider per org | id, org_id, provider_key, display_name, is_simulated, status, last_synced_at, credentials_ref |
| `sync_runs` | Ingestion audit log | id, connection_id, org_id, run_date, status, started_at, finished_at, error |
| `metrics` | Normalized daily facts, one row per (date, metric_key, entity) | id, org_id, date, domain, metric_key, entity_type, entity_id, value, unit |
| `targets` | MTD-vs-target comparisons | id, org_id, metric_key, month, target_value |
| `findings` | Rule/anomaly engine output | id, org_id, date, domain, severity, title, what_changed, why_it_matters, confidence, score, evidence_metric_refs (json), recommended_next_step |
| `briefs` | Generated daily briefs | id, org_id, date, status, overall_status, executive_summary, wins/risks/opportunities/recommended_actions/key_numbers (json), evidence_finding_refs (json), confidence, prompt_version, model, is_fallback, generated_at |
| `deliveries` | Simulated delivery log | id, brief_id, channel, status, sent_at |

**Design decision**: comparisons (DoD, same-weekday WoW, trailing-7-day average, MTD-vs-target) are **not** a persisted table. They're pure functions computed on demand from `metrics` + `targets`, shared by the rule engine and the Scorecard UI. This avoids a stale-cache class of bugs and keeps the schema smaller — revisit only if computing comparisons on every page load becomes a measured performance problem (unlikely at 30 days × 1 org).

`credentials_ref` on `data_connections` is a documented stub, not real encryption, since every provider in the MVP is simulated — see `ai-safety-and-grounding.md`/`architecture.md` for where a real secrets vault (KMS, Vault, etc.) would sit in a production deployment.

## 4. Analytics & Intelligence Pipeline

```
DataProvider.fetchDailyMetrics(orgId, date) → NormalizedMetric[]
        │  (6 mock adapters: shopify, meta, google-ads, klaviyo, gorgias, inventory)
        ▼
Ingestion — one sync_run per provider per day, writes `metrics` rows
        ▼
Comparison engine — pure functions: dayOverDay, sameWeekdayWoW, trailing7Avg, targetVariance
        ▼
Rule engine — declarative threshold rules → findings (severity, what-changed, why-it-matters, evidence, confidence)
        ▼
Anomaly scoring — z-score vs trailing window, flag |z| > 2
        ▼
Cross-domain rules — composite rules for the PRD's named examples:
  • revenue down + traffic flat → conversion-issue finding
  • spend growth outpacing revenue growth → efficiency finding
  • refund spike tied to one SKU → product-quality finding
  • ticket spike with "shipping" contact reason → fulfillment finding
        ▼
Finding prioritization — deterministic score = severity-weight × magnitude × confidence
        ▼
Top-N findings → AI brief generation input
```

Every stage above is a pure, independently testable module. This matches `workflows/03-data-analytics.md` with no deviation.

## 5. AI Pipeline

```
Top-ranked findings (from analytics pipeline)
        ▼
Input schema validation (Zod)
        ▼
Versioned system prompt:
  - narrate ONLY the provided findings
  - cite finding IDs for every claim
  - distinguish verified fact / calculated finding / hypothesis / recommended investigation
  - ban generic advice ("continue monitoring...") and unsupported financial claims
        ▼
LlmClient.generate(...)  ─┬─ OpenAI-compatible fetch client (LLM_API_KEY present)
                          └─ Deterministic template fallback (no key, or LLM path fails)
        ▼
Parse → Zod validate output schema
        ▼
Evidence enforcement — reject any evidence_ref not in the input finding-ID set
        ▼
One retry with validation error fed back to the model, on failure
        ▼
Fallback to deterministic template on repeat failure
        ▼
Persist to `briefs` with prompt_version, model, is_fallback, generation metadata
```

**Brief schema** (Zod): `overall_status, executive_summary, wins[], risks[], opportunities[], recommended_actions[], key_numbers, evidence_refs[] (finding IDs), confidence`.

**The deterministic fallback is a first-class deliverable, not an afterthought.** It assembles a genuinely readable narrative from the top findings via real templates (not a naive field dump), because most demo viewers without an API key will only ever see this path — and it must hold up as a portfolio artifact on its own.

## 6. Demo Scenario (summary — full detail in `demo-scenario.md`)

Fictional brand: **Northbound Supply Co.**, a DTC outdoor/EDC gear brand (packs, bottles, tools) at ~$8–12M/yr, fitting the PRD's $3–50M target band. 30 days of data from one deterministic scenario generator (seeded PRNG for micro-noise only; the macro shape of every condition is scripted, not random), encoding all 9 PRD-required conditions:

1. Revenue down over the final ~6 days while sessions/traffic hold steady → conversion-rate finding.
2. Meta CPA drifting upward across the full window (creative fatigue).
3. One named Meta campaign ("Prospecting – Bestseller Bundle") collapsing sharply in the final week.
4. Top SKU (best-selling pack) crossing a stockout-risk days-of-inventory threshold near the end.
5. Refunds rising specifically on one SKU (a recently redesigned bottle) — product-quality signal.
6. Support tickets with a shipping/delay contact reason spiking in the final ~10 days.
7. Klaviyo flow revenue (abandoned cart + welcome series) strong and growing — partially offsetting weak paid acquisition.
8. Returning-customer revenue holding steady/strong while new-customer conversion is the weak spot — a clean causal story (acquisition funnel issue, retention healthy).
9. Opportunity: a smaller campaign or newer product line meaningfully outperforming its spend/forecast → reallocation recommendation.

## 7. Risks, Tradeoffs, Assumptions

- SQLite single-writer concurrency is a non-issue for a single-demo-org MVP; the Postgres swap path is documented, not built.
- No queue/worker/cron daemon — on-demand generation runs synchronously inside a server action/API route. A `npm run brief:generate` script documents the future daily-schedule path (e.g., a cron trigger calling the same script) without building a daemon now.
- Assumption: no login/auth flow. A single implicit demo org/user context is used throughout. `memberships`/roles exist in the schema for shape only, so multi-tenancy isn't foreclosed later.
- Assumption: `credentials_ref` is a documented stub rather than real encryption, since every provider is simulated in the MVP.
- Charts are hand-rolled SVG only, per the resource budget — no recharts/d3/chart.js.
- **Main execution risk**: deterministic-fallback narrative quality. Mitigated by treating it as a primary deliverable with real template design, not a last-resort branch.
- **Main scope risk**: cross-domain rule coverage is capped at the PRD's explicitly named examples — this is not a general-purpose correlation engine, and should not grow into one without a new decision.

## 8. Phased Task List

### Phase 1 — Plan & Architecture — `[x]` (this document)
Owner: orchestrator (Fable 5). Produced this roadmap, `demo-scenario.md`, stubs for the remaining `docs/` files, and initial `workspaces/*/context.md` content.

### Phase 2 — Foundation — `[x]`
Workflow: `workflows/02-foundation.md`. Owner: Terra worker.
- Next.js App Router project (repo root), strict TypeScript, Tailwind, ESLint, Vitest. `src/app/` for routes, `src/lib/*` for all domain modules, `@/*` path alias.
- Drizzle + `better-sqlite3`: `src/lib/db/schema.ts` (all 10 tables from §3, Postgres-portable types), `src/lib/db/client.ts`, `drizzle.config.ts`, `npm run db:push` / `npm run db:seed` (`src/lib/db/seed.ts`, idempotent, `tsx`-run).
- `src/lib/env.ts` — Zod env validation, pure `parseEnv()` + module-level `env` export (`DATABASE_PATH` defaults to `./data/app.db`, `LLM_API_KEY`/`LLM_BASE_URL` optional).
- `src/lib/domain/index.ts` — shared entity types; `src/lib/logger.ts` — structured console logger; `src/lib/util/prng.ts` — seeded mulberry32 PRNG (`createPrng`, `randInt`, `pick`) for reuse by Phase 3's scenario generator.
- Vitest wired; first real test `src/lib/env.test.ts` (3 cases).
- **Accept**: `npm run typecheck && npm run lint && npm run test` green; `db:seed` creates 1 org ("Northbound Supply Co."), 1 user, 1 membership, 5 data connections (shopify/meta/google-ads/klaviyo/gorgias), idempotently. Verified.

### Phase 3 — Data & Analytics — `[ ]`
Workflow: `workflows/03-data-analytics.md`. Owner: Terra worker.
- `DataProvider` interface + 6 mock providers + the scenario generator encoding all 9 conditions.
- Comparison engine, rule engine, anomaly scoring, cross-domain rules, prioritization — all pure functions, all tested.
- **Accept**: a test suite proves each of the 9 scripted conditions produces its expected finding.

### Phase 4 — AI Brief Generation — `[ ]`
Workflow: `workflows/04-ai-brief.md`. Owner: Terra worker (prompt design reviewed by orchestrator first).
- `LlmClient` abstraction + fallback implementation, Zod brief schema, versioned prompt, evidence enforcement + retry, persistence.
- **Accept**: schema-invalid and evidence-invalid LLM outputs are rejected/retried; the fallback produces a complete, readable brief for the seeded scenario with zero API key.

### Phase 5 — Product Interface — `[ ]`
Workflow: `workflows/05-interface.md`. Owner: Terra worker (visual system defined by orchestrator first).
- Today's Brief, Scorecard, Alerts & Opportunities, History, Data Sources + "Generate Today's Brief" action.
- Loading/empty/error states everywhere, responsive, keyboard-accessible core interactions.
- **Accept**: all 5 routes render against seeded data; brief generation is triggerable from the UI.

### Phase 6 — Delivery, Testing, Docs — `[ ]`
Workflow: `workflows/06-delivery-docs.md`. Owner: Terra worker build; orchestrator final adversarial review.
- On-demand generation endpoint + `npm run brief:generate` script, printable brief view + simulated delivery log.
- Fill remaining test gaps; full suite < 60s.
- Complete `docs/` set, README (17-section spec), ROI model, `consulting-implementation.md`.
- **Accept**: cold clone → documented setup → working demo; adversarial review finds no material issues left unresolved.

---

## Open Items / Assumptions Log

- Fictional brand name and its 9 scripted conditions (§6) are an orchestrator decision, not user-specified — documented here and in `demo-scenario.md` per CLAUDE.md's "log it and keep moving" rule.
- No separate `packages/*` workspace was built; `src/lib/*` module boundaries serve the same purpose at this project's scale (§2).
- Revisit the "no persisted comparisons table" decision (§3) only if profiling shows on-demand comparison computation is a real bottleneck — not expected at this data volume.
