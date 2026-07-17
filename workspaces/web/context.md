# web workspace context

## Domain scope
Owns the Next.js App Router UI: the five product views, the "Generate Today's Brief" action, and all loading/empty/error states. Consumes `briefs`/`findings`/`metrics` (read-only) and the `analytics` workspace's comparison functions for the Scorecard; does not compute anything itself beyond simple presentation-layer derivations.

## Status: Phase 6 complete (2026-07-17)

All 5 views + generate action built, typechecked, linted, tested, and manually
verified end-to-end (dev server route hits + direct server-action HTTP
invocation). See `docs/implementation-roadmap.md` Phase 5 for the acceptance
summary. Phase 6 (delivery + docs) added on-demand generation surfaces, a
printable brief view, simulated delivery, and completed the doc set — see
below.

## Files touched

**New:**
- `src/components/Card.tsx`, `StatusBanner.tsx`, `SeverityBadge.tsx`,
  `KeyNumberTile.tsx`, `Sparkline.tsx`, `BarChart.tsx`,
  `EvidenceDisclosure.tsx`, `EmptyState.tsx`, `ErrorState.tsx`,
  `LoadingSkeleton.tsx`, `ConnectionCard.tsx`, `SidebarNav.tsx`
- `src/lib/web/queries.ts` — typed, org-scoped data access (`getDemoOrg`,
  `getLatestBrief`, `getBriefByDate`, `listBriefs`, `getFindingsForDate`,
  `getFindingsByIds`, `getMetricsByIds`, `getAllMetrics`, `getTargets`,
  `listDataConnections`, `getLatestSyncRun`, `TODAY = "2026-07-16"` constant —
  never `new Date()`, the demo's "today" is fixed)
- `src/lib/web/format.ts` — `humanizeMetricKey`, `guessUnitForMetricKey`
  (added as a standalone "Task 1b" step specifically to avoid a file-write
  race between the Today's Brief and Scorecard delegations, which both
  needed the same two helpers)
- `src/lib/web/status-styles.ts` — `STATUS_STYLES`/`SEVERITY_STYLES` maps
- `src/app/actions/generate-brief.ts` — `generateTodaysBrief()` server action
  (idempotent: returns the existing row if `TODAY`'s brief already exists;
  revalidates `/` and `/history`)
- `src/app/scorecard/page.tsx`, `src/app/alerts/page.tsx`,
  `src/app/history/page.tsx`, `src/app/sources/page.tsx`

**Modified:**
- `src/app/globals.css` — design tokens: `--color-surface`/`--color-border`/
  `--color-muted`, one restrained accent, 4-color status scale
  (strong/stable/mixed/at_risk) and 4-color severity scale
  (critical/warning/opportunity/info), each with a soft-bg variant, all with
  light/dark values via `prefers-color-scheme`.
- `src/app/layout.tsx` — sidebar/top-bar shell, org name pulled from the
  single seeded org, 5 nav links via `SidebarNav`.
- `src/app/page.tsx` — Today's Brief view (rewritten from scaffold).
- `src/lib/db/seed.ts` — rewritten async; see "Task 0 pipeline gap" below.

## Decisions made this phase

- **Task 0 pipeline gap closed**: `seed.ts` previously only created
  org/user/membership/5 connections — no phase had ever run
  ingest → group → rules/anomaly/cross-domain → prioritize → persist →
  `generateBrief` against the real `data/app.db` (every prior phase tested
  against an in-memory DB). Fixed: seed now adds the missing 6th
  `inventory` connection (closes the Phase 3 open item), ingests all 30
  scenario days, computes findings for each day, seeds 4 MTD targets
  (`gross_sales`/`spend` × June/July), and pre-generates briefs for
  day-index 0–28 (29 days) via the real `generateBrief()` — day 29
  (2026-07-16, "today") is deliberately left ungenerated so the UI's
  empty-state + "Generate Today's Brief" CTA has something real to demo.
  Verified idempotent by running `db:seed` 3× and confirming stable row
  counts (6 connections, 1410 metrics, 495 findings, 4 targets, 29 briefs).
- **Design tokens**: status and severity intentionally share one 4-color
  family (red/amber/green/slate-ish) so the two scales read as one
  consistent visual system rather than two competing palettes. Delta colors
  (positive/negative/flat) always pair a glyph with color, never color alone.
- **`EvidenceDisclosure.summary` widened to `ReactNode`** (was `string`):
  History needed to pass JSX (date + `SeverityBadge` + excerpt) as the
  `<details>` summary. Backward-compatible with the plain-string call sites
  in other views.
- **`SeverityBadge` fix**: indexing a `Record<StatusKey,...> | Record<SeverityKey,...>`
  union by `keyof typeof` collapses to `never` when the key sets are
  disjoint (TS quirk) — the lookup casts to `Record<string, {...}>` instead.

## Interfaces owned
- None consumed by other workspaces — this is the top of the dependency graph.

## Phase 6 — Delivery, Testing, Docs (2026-07-17)

**New:**
- `src/lib/delivery/generate-and-deliver.ts` — `generateAndDeliverBrief(db, orgId, date)`,
  the single source of truth for "get or create today's brief, then deliver
  it": reuses an existing brief for the date (via `getBriefByDate`) or calls
  `generateBrief`, then always calls `simulateDelivery`. Used identically by
  the server action, `scripts/brief-generate.ts`, and `POST /api/brief/generate`
  so generation logic isn't duplicated three times.
- `src/lib/delivery/simulate-delivery.ts` — `simulateDelivery(db, briefId)`,
  idempotent: inserts one `email` + one `slack` row into `deliveries` (both
  `status: "sent"`) on first call, returns the same 2 rows unchanged on repeat
  calls for the same `briefId`.
- `scripts/brief-generate.ts` — `npm run brief:generate` CLI entry point.
- `src/app/api/brief/generate/route.ts` — `POST` route wrapping the same
  function, intended as the future cron/scheduler target instead of a daemon.
- `src/app/brief/[id]/print/page.tsx` — printable brief view (additive only,
  did not touch `src/app/page.tsx`'s rendering). Renders inside the shared
  root layout (inherits the `aside` sidebar), so `globals.css`'s
  `@media print` rule hides `aside` and anything marked `.no-print`.
- `src/components/PrintButton.tsx` — client component, `window.print()`.
- `src/lib/web/format.test.ts`, `src/lib/delivery/simulate-delivery.test.ts`,
  `src/lib/delivery/generate-and-deliver.test.ts` — closed the test gaps
  flagged at the end of Phase 5.

**Modified:**
- `src/app/actions/generate-brief.ts` — now delegates to
  `generateAndDeliverBrief` instead of duplicating the
  get-or-create-brief check inline.
- `src/lib/web/queries.ts` — added `getBriefById`, `getDeliveriesForBrief`.
- `src/app/page.tsx`, `src/app/history/page.tsx` — added a "Print" link to
  each brief (Today's Brief header; each History row's disclosure summary).
- `src/app/globals.css` — `@media print` rule.
- No schema changes: `deliveries` table already existed from Phase 2, unused
  until this phase.

## Decisions made this phase (Phase 6)

- **`generateAndDeliverBrief` as single source of truth**: rather than let
  the action/script/route each duplicate "check for existing brief, else
  generate, then deliver," all three call one function. Verified idempotent
  by test (repeat calls for the same org/date return the same brief row and
  the same 2 delivery rows, no duplicates).
- **Print view is additive-only**: `/brief/[id]/print` is a new route reusing
  the existing Card/StatusBanner/EvidenceDisclosure components rather than
  refactoring `src/app/page.tsx`, to avoid risking already-verified Phase 5
  code for a presentation-only feature.
- **No server-side PDF generation**: print-to-PDF is via the browser's native
  `window.print()` + `@media print` CSS only, per the resource budget (no
  heavy deps like puppeteer).
- **Nesting a `Link` inside `EvidenceDisclosure`'s `<summary>` is safe**:
  considered whether the History row's "Print" link would also toggle the
  native `<details>` open/closed on click (a known browser gotcha when
  nesting interactive elements in `<summary>`). Confirmed safe: Next.js's
  `Link` calls `preventDefault()` on click, which also cancels the browser's
  default toggle behavior for the ancestor `<summary>`.

## Interfaces owned
- None consumed by other workspaces — this is the top of the dependency graph.

## Open items
- No Settings view — confirmed scope decision (narrows the PRD's "Settings
  needed for demo" line), not an oversight.
- Adversarial review pass for Phase 6 complete — found and fixed 2
  documentation issues (stale `src/lib/notifications` reference in
  `docs/architecture.md`; duplicate walkthrough stub in
  `docs/demo-scenario.md`), no material issues remaining.
- No git commit made this session — not requested by the user.
