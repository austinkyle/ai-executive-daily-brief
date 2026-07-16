# Workflow 02 — Foundation (GPT 5.6 Terra, build mode)

Context: CLAUDE.md + workspaces/database/context.md + docs/implementation-roadmap.md (Phase 2 section only).

Implement:
1. Next.js App Router project, strict TypeScript, Tailwind, ESLint, Vitest. Single app — no monorepo tooling overhead unless the plan justified packages/ as plain TS path aliases (preferred: `src/lib/*` modules with clear boundaries instead of a heavy workspace setup).
2. Drizzle + better-sqlite3. Full schema per the plan's data model. Migration + `npm run db:push` / `db:seed` scripts.
3. Env validation module (Zod): `LLM_API_KEY` optional (absence = deterministic mode), `LLM_BASE_URL`, `DATABASE_PATH`.
4. Domain types in `src/lib/domain/` shared across layers.
5. Structured logger (tiny, no dependency heavier than pino — a 30-line console wrapper is acceptable).
6. Seed infrastructure skeleton: deterministic PRNG (seeded mulberry32 or similar), org + user + 5 data_connections created.
7. Vitest wired with one real test (env validation).

Ritual: typecheck, lint, test, update roadmap + database/context.md, commit.
