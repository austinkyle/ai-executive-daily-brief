# Workflow 01 — Plan & Architecture (Fable 5, plan mode ON)

Read CLAUDE.md and docs/product-requirements.md in full. Then, before writing any application code:

1. Restate the product objective and MVP boundary in your own words.
2. Confirm the locked stack (Next.js/TS/SQLite+Drizzle/Zod/Vitest) and explain any adjustment you'd argue for — but you may not add Docker, Postgres, or a separate worker service (resource budget in CLAUDE.md).
3. Design the core data model: organizations, users, memberships, data_connections, sync_runs, metrics (normalized daily facts), findings, briefs, brief_sections/evidence links. Keep it Postgres-portable.
4. Design the analytics pipeline: provider adapter contract → ingestion → normalization → comparison engine (DoD, WoW same-weekday, 7-day rolling, target variance) → rule engine → anomaly scoring → finding prioritization.
5. Design the AI pipeline: structured findings in → validated schema → versioned prompt → structured brief out → Zod validation → retry → deterministic fallback → persistence with generation metadata.
6. Define the demo scenario: the fictional brand, its 9 scripted business conditions (per PRD), and how the seed script encodes causal coherence.
7. List risks/tradeoffs and every assumption you're making.
8. Produce a phased task list with acceptance criteria mapped to workflows 02–06.

Write the full plan to `docs/implementation-roadmap.md`, write the demo design to `docs/demo-scenario.md`, and stub the remaining docs/ files with outlines. Create all workspaces/*/context.md files with initial context (domain scope, key files planned, interfaces owned).

Summarize the plan in your response. Do not ask broad questions — assume, document, proceed.
