# Workflow 05 — Product Interface (GPT 5.6 Terra; Fable 5 design pass first)

Context: CLAUDE.md + workspaces/web/context.md.

Design pass (Fable 5, before building): define the visual system — executive, calm, information-dense but hierarchical. Dark-capable, Tailwind tokens, no component library heavier than headless primitives. Charts = hand-rolled SVG sparklines/bars (no recharts/chart.js — resource budget).

Build five views:
1. **Today's Brief** (`/`): status banner, executive summary, wins/risks/actions with severity styling, key numbers strip, expandable evidence per claim (finding → metrics).
2. **Scorecard** (`/scorecard`): metrics grid across 5 domains with DoD / same-weekday / 7-day-avg deltas, target variance, sparklines.
3. **Alerts & Opportunities** (`/alerts`): findings grouped by severity; each card = what changed, why it matters, evidence, confidence, next step.
4. **History** (`/history`): past briefs list + detail view, simple trend of overall_status.
5. **Data Sources** (`/sources`): connection cards, sync status, last sync, simulated-badge, error states.

Plus: "Generate Today's Brief" action (server action → pipeline), loading/empty/error states everywhere, responsive, keyboard-accessible core interactions.

Ritual per CLAUDE.md.
