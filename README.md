# AI Executive Daily Brief

**[FDE case study](FDE-CASE-STUDY.md)** — software establishes findings, optional AI narrates, executives decide. This is a fictional-data portfolio MVP; no client observation, production adoption, or measured savings is claimed.

## What is this, in plain English?
Imagine you run an online store. Every day, important information about your business lives scattered across five or six different apps: your storefront (Shopify), your ad accounts (Meta, Google), your email marketing (Klaviyo), your customer support inbox (Gorgias), and your warehouse/inventory system. To know "how is my business doing today?" a busy founder has to log into all of them, remember what normal looks like, and manually connect the dots — *"oh, refunds are up on this one product, and support tickets about shipping are also up, and inventory for that same product is almost out... those are probably related."*

This project automates that morning ritual. It's a small web app that:
1. **Pulls in a day's worth of business data** (simulated here, but structured exactly like the real thing).
2. **Runs the math a sharp analyst would run** — is this number unusual compared to the recent trend? Is it correlated with something in a different system? — using plain statistics, not guesswork.
3. **Writes it up in plain English**, as a short morning briefing: what changed, why it matters, and what to do about it. An AI model can write the narration, but it is instructed to describe only supplied findings. Schema checks and finding-ID validation constrain the output, but do not prove every narrative sentence is factually entailed. An executive still reviews recommendations against the evidence.
4. **Shows it to you** in a clean dashboard, with a one-click "print / save as PDF" version you could hand to an executive team.

The whole thing runs on your laptop with one command, needs no paid API keys or accounts to try (it has a built-in "no AI key" mode that still writes a coherent brief), and uses a realistic 30-day simulated dataset for a fictional outdoor-gear brand, "Northbound Supply Co.," so you can see it work end-to-end immediately.

This is a **portfolio/demo project**, not a live product connected to real stores — think of it as a working prototype that shows how such a product would be built, all the way from data to a decision an executive can act on in under two minutes.

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

## Screenshots
Not yet captured in this repo. To generate them yourself: `npm run dev` and `npm run db:seed`, then visit each route below at a 1440px viewport and save into `docs/screenshots/`:

| View | Route | Suggested filename |
|---|---|---|
| Today's Brief | `http://localhost:3000/` | `docs/screenshots/todays-brief.png` |
| Scorecard | `http://localhost:3000/scorecard` | `docs/screenshots/scorecard.png` |
| Alerts | `http://localhost:3000/alerts` | `docs/screenshots/alerts.png` |
| History | `http://localhost:3000/history` | `docs/screenshots/history.png` |
| Data Sources | `http://localhost:3000/sources` | `docs/screenshots/data-sources.png` |
| Print view | `http://localhost:3000/brief/[id]/print` (any seeded brief id) | `docs/screenshots/brief-print.png` |

## Architecture overview
A modular monolith: one Next.js App Router application separates provider adapters, ingestion, analytics, intelligence, AI narration, persistence, delivery simulation, and UI without microservices, queues, Docker, or a worker daemon. SQLite via Drizzle keeps local setup light and has a documented Postgres path. See [architecture](docs/architecture.md).

## Data flow
```text
simulated providers → normalized metrics and sync runs → comparisons/rules/anomalies/cross-domain checks
→ prioritized findings with metric evidence → LLM or deterministic fallback narrative
→ validated brief and simulated delivery rows → product views and print view
```
The LLM receives findings rather than source rows. Its evidence references must map to input findings; invalid references and schema failures trigger retry/fallback. Valid IDs alone do not prove narrative entailment or causal correctness.

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
