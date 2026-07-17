# AI Executive Daily Brief

## Product overview
AI Executive Daily Brief is a portfolio-quality decision-support MVP for **Northbound Supply Co.**, a fictional Shopify DTC outdoor/EDC brand. Deterministic analytics identify evidence-linked findings; an optional OpenAI-compatible LLM writes narrative only from those findings. A deterministic fallback narrator is a fully supported, no-API-key path.

## Business problem
DTC founders assemble a morning view across commerce, paid media, lifecycle, support, and inventory tools. This manual work is slow and can hide cross-domain signals. The product converts normalized data into prioritized, evidence-linked actions.

## Target customer
Founders and executive teams at Shopify-based DTC brands in the roughly $3M–$50M annual-revenue range, using systems such as Shopify, Meta Ads, Google Ads, Klaviyo, Gorgias, and inventory software.

## Business value
The brief reduces repetitive reporting work and helps teams review material risks and opportunities sooner. It supports investigation and better-informed decisions; it does not promise revenue results. See the editable [ROI framework](docs/roi-model.md).

## Key features
- Deterministic analytics, anomalies, cross-domain checks, and evidence-linked findings.
- Provider-abstracted, OpenAI-compatible narrative generation that receives findings—not raw metrics.
- First-class deterministic fallback narrator when no API key is configured.
- 30 days of seeded Northbound data, six simulated connections (`shopify`, `meta`, `google-ads`, `klaviyo`, `gorgias`, `inventory`), and nine scripted causal conditions.
- Five views: Today's Brief, Scorecard, Alerts, History, and Data Sources.
- UI, `npm run brief:generate`, and `POST /api/brief/generate` generation entry points.
- Printable `/brief/[id]/print` view with browser **Print / Save as PDF**, not server-side PDF generation.
- Simulated `email` and `slack` `sent` rows in `deliveries`; no SMTP or Slack API integration.

## Screenshots (placeholders)
<!-- Capture Today's Brief at viewport width 1440px: after running `npm run dev` and `npm run db:seed`, visit `http://localhost:3000/`; save the image as `docs/screenshots/todays-brief.png`. -->
![Today's Brief placeholder](docs/screenshots/todays-brief.png)

<!-- Capture Scorecard at viewport width 1440px: after running `npm run dev` and `npm run db:seed`, visit `http://localhost:3000/scorecard`; save the image as `docs/screenshots/scorecard.png`. -->
![Scorecard placeholder](docs/screenshots/scorecard.png)

<!-- Capture Alerts at viewport width 1440px: after running `npm run dev` and `npm run db:seed`, visit `http://localhost:3000/alerts`; save the image as `docs/screenshots/alerts.png`. -->
![Alerts placeholder](docs/screenshots/alerts.png)

<!-- Capture History at viewport width 1440px: after running `npm run dev` and `npm run db:seed`, visit `http://localhost:3000/history`; save the image as `docs/screenshots/history.png`. -->
![History placeholder](docs/screenshots/history.png)

<!-- Capture Data Sources at viewport width 1440px: after running `npm run dev` and `npm run db:seed`, visit `http://localhost:3000/sources`; save the image as `docs/screenshots/data-sources.png`. -->
![Data Sources placeholder](docs/screenshots/data-sources.png)

<!-- Capture Print view at viewport width 1440px: after running `npm run dev` and `npm run db:seed`, visit `http://localhost:3000/brief/[id]/print` using any seeded brief id from the database; save the image as `docs/screenshots/brief-print.png`. -->
![Print view placeholder](docs/screenshots/brief-print.png)

## Architecture overview
A modular monolith: one Next.js App Router application separates provider adapters, ingestion, analytics, intelligence, AI narration, persistence, delivery simulation, and UI without microservices, queues, Docker, or a worker daemon. SQLite via Drizzle keeps local setup light and has a documented Postgres path. See [architecture](docs/architecture.md).

## Data flow
```text
simulated providers → normalized metrics and sync runs → comparisons/rules/anomalies/cross-domain checks
→ prioritized findings with metric evidence → LLM or deterministic fallback narrative
→ validated brief and simulated delivery rows → product views and print view
```
The LLM cannot mine source rows. Its evidence references must map to input findings; invalid output is rejected.

## Tech stack
- Next.js App Router, React, TypeScript strict, Tailwind CSS
- SQLite via Drizzle and `better-sqlite3` (no Docker/Postgres locally)
- Zod boundary validation and Vitest business-logic tests
- OpenAI-compatible API client behind a provider abstraction; no heavy dependencies

## Local setup
Prerequisite: a supported Node.js/npm installation.
```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```
Open <http://localhost:3000>.

## Environment variables
`src/lib/env.ts` is authoritative. Only these variables are used:

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `LLM_API_KEY` | No | — | Enables the OpenAI-compatible path; omission uses the normal deterministic fallback. |
| `LLM_BASE_URL` | No | — | Optional valid OpenAI-compatible API base URL. |
| `LLM_MODEL` | No | `gpt-4o-mini` | Model identifier for the LLM path. |
| `DATABASE_PATH` | No | `./data/app.db` | SQLite database file path. |

## Demo instructions
Run this exact sequence:
```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```
Open <http://localhost:3000>, click **Generate Today's Brief**, then visit Scorecard, Alerts, History, and Data Sources. Finally, use the Today's Brief page **Print** link and use the browser **Print / Save as PDF** button.

For non-UI generation, `npm run brief:generate` generates and simulates delivery for a supplied date (default: today). `POST /api/brief/generate` does the same and is the intended target for a fixed-schedule cron, GitHub Actions scheduled workflow, hosted cron service, or OS-level scheduler—not a long-running daemon.

## Testing instructions
Run checks individually:
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```
Tests focus on deterministic comparisons, rules, anomalies, prioritization, schema/evidence enforcement, and the nine seeded demo conditions.

## Current limitations
- One seeded org and implicit demo user; no production auth or organization switcher.
- Six simulated sources only; no live provider API, vault, SMTP, or Slack API.
- SQLite suits this local single-org MVP, not high-concurrency production use.
- Generation is on demand. A scheduler path is documented, but no cron service or long-running process is included.
- Browser print-to-PDF is supported; server-side PDF generation is intentionally excluded.
- The rule set is scoped to the scenario, not a general correlation engine.

## Future integrations
Real Shopify, Meta Ads, Google Ads, Klaviyo, Gorgias, inventory/fulfillment, GA4, accounting, and warehouse adapters can replace mocks behind the same provider boundary. A production deployment can add credential storage, auth, Postgres, observability, and real email/Slack delivery. A hosted cron service, GitHub Actions scheduled workflow, or OS scheduler can call `POST /api/brief/generate` or `npm run brief:generate` daily; the project deliberately has no daemon.

## Roadmap
Foundation, deterministic data/analytics, grounded AI generation, and the five-view interface are complete. The delivery/docs phase adds the generation script and API endpoint, print view, simulated delivery logs, walkthrough, ROI model, and swap-path docs. See [implementation roadmap](docs/implementation-roadmap.md).

## ROI framework
[docs/roi-model.md](docs/roi-model.md) is an editable assumptions-based model for reporting time, analyst/operations capacity, faster detection, stockout exposure, wasted ad spend, and decision speed. Defaults are illustrative and must be replaced with a real client's numbers during an engagement; it makes no guaranteed revenue claim.
