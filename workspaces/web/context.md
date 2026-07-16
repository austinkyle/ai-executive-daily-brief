# web workspace context

## Domain scope
Owns the Next.js App Router UI: the five product views, the "Generate Today's Brief" action, and all loading/empty/error states. Consumes `briefs`/`findings`/`metrics` (read-only) and the `analytics` workspace's comparison functions for the Scorecard; does not compute anything itself beyond simple presentation-layer derivations.

## Key files planned
- `app/page.tsx` — Today's Brief: status banner, executive summary, wins/risks/actions with severity styling, key numbers strip, expandable evidence per claim.
- `app/scorecard/page.tsx` — metrics grid across the 5 domains with DoD / same-weekday / 7-day-avg deltas, target variance, sparklines.
- `app/alerts/page.tsx` — findings grouped by severity; each card shows what-changed, why-it-matters, evidence, confidence, next step.
- `app/history/page.tsx` — past briefs list + detail view, simple overall_status trend.
- `app/sources/page.tsx` — data_connections cards: sync status, last sync, simulated badge, error states.
- `app/brief/[id]/print/page.tsx` — printable/downloadable brief view (Phase 6 delivery mechanism).
- Server action wiring "Generate Today's Brief" to the `ai`/`intelligence`/`analytics` pipeline.
- Hand-rolled SVG sparkline/bar components (no chart library, per resource budget).

## Interfaces owned
- None consumed by other workspaces — this is the top of the dependency graph.

## Decisions from Workflow 01
- Visual system: executive, calm, information-dense but hierarchical; dark-capable Tailwind tokens; no component library heavier than headless primitives. Full visual design pass happens at the start of Phase 5, before Terra builds the views (per `workflows/05-interface.md`).
- Charts are hand-rolled SVG only — no recharts/chart.js/d3.

## Open items
- Nothing implemented yet — starts in Phase 5 (`workflows/05-interface.md`), after Phases 2–4 provide real data/briefs to render.
