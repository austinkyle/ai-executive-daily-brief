# AI Executive Daily Brief — CLAUDE.md

## What This Is
Production-minded MVP: an AI Executive Daily Brief for Shopify-based DTC brands ($3M–$50M). Every morning it turns fragmented business data (commerce, paid ads, email, support, inventory) into a 2-minute decision-ready executive brief. Deterministic analytics first, LLM narrative second. Portfolio project — must demo end-to-end with zero real credentials via a seeded fictional brand.

Full product spec lives in `docs/product-requirements.md`. Read it before any planning session. Do NOT re-read it during routine build tasks — the workspace context.md files carry what you need.

## WAT Framework
This project uses Workflows → Agent → Tools structure:

```
CLAUDE.md                  ← you are here (router only, keep lean)
workflows/                 ← phase prompts, run in order
  01-plan.md
  02-foundation.md
  03-data-analytics.md
  04-ai-brief.md
  05-interface.md
  06-delivery-docs.md
workspaces/                ← per-domain context.md files
  database/context.md
  analytics/context.md
  intelligence/context.md
  ai/context.md
  web/context.md
docs/                      ← product + architecture docs
apps/ packages/            ← code (modular monolith)
```

**Routing rule:** When working in a domain, read ONLY that workspace's context.md plus this file. Do not load other workspaces unless the task crosses domains. Update the relevant context.md at the end of every session with: decisions made, files touched, open items.

## Model Routing (proxy-managed)
- **Planning / architecture / adversarial review** → Fable 5 (workflows 01, plan-mode steps, end-of-phase reviews)
- **Building / implementation** → GPT 5.6 Terra (workflows 02–06 execution)
- Start each build workflow by restating the plan section it implements. If the plan is ambiguous, make the smallest reasonable assumption, log it in the workspace context.md, and keep moving.

## Stack (locked — do not relitigate)
Next.js (App Router) + TypeScript strict, Tailwind, **SQLite via Drizzle** (not Postgres — see Resource Budget), Zod validation, Vitest, no Docker. OpenAI-compatible LLM client behind a provider abstraction with a deterministic no-key fallback mode.

## Resource Budget (hard constraints)
The user's machine is the constraint, not token spend. Spend tokens generously on planning, code quality, tests, and docs. Spend disk/CPU sparingly:

- **SQLite file DB, no Docker, no Postgres container.** Schema must stay Postgres-portable (Drizzle makes swap trivial; document the swap path in architecture.md).
- Single Next.js app. API routes + a script-triggered job runner instead of a separate worker process. No Redis, no queues, no microservices.
- `npm` only. No heavy deps (no puppeteer, no chart libs >100KB when a lightweight SVG chart component will do — build charts as simple React/SVG components).
- Seed data generated deterministically by script into SQLite; do not commit large JSON fixtures. 30 days × 1 company only.
- No file watchers/daemons left running. Tests must complete in <60s.

## Non-Negotiables
1. Analytics are deterministic. The LLM receives structured findings + evidence; it never mines raw data or invents explanations. Every claim in a brief maps to a finding ID.
2. Demo data is coherent and causal (scripted business conditions per `docs/demo-scenario.md`), reproducible from a fixed seed.
3. Works fully with no API key: deterministic narrative fallback assembles briefs from findings templates.
4. Multi-tenant-shaped data model (orgs, users, connections, briefs, findings, metrics, sync runs) without building enterprise auth.
5. Strict TS, Zod at boundaries, env validation, structured errors. No hardcoded secrets.
6. Tests target business logic: comparisons, rolling averages, thresholds, anomaly scoring, finding prioritization, AI schema validation, evidence-reference enforcement, demo-condition detection.

## Definition of Done
Local run documented in README → seed demo company → generate brief on demand → Today's Brief, Scorecard, Alerts, History, Data Sources views all functional → tests green → docs/ complete per PRD → provider swap path documented.

## End-of-Phase Ritual
1. `npm run typecheck && npm run lint && npm run test`
2. Fix failures before proceeding.
3. Update `docs/implementation-roadmap.md` status + relevant workspace context.md.
4. Commit with conventional message (`feat(analytics): ...`).
5. Adversarial review pass (Fable 5): "What would a senior engineer flag in this phase's diff?"
