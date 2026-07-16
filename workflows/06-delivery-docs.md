# Workflow 06 — Delivery, Testing, Docs (GPT 5.6 Terra build; Fable 5 final review)

Context: CLAUDE.md + all workspace context.md files (final integration pass).

Implement:
1. On-demand generation endpoint + `npm run brief:generate` script (future cron target — document the schedule path, don't build a daemon).
2. One delivery channel: printable/downloadable brief view (`/brief/[id]/print`) + simulated email/Slack delivery log entries. No real SMTP.
3. Fill test gaps flagged in roadmap. All tests <60s total.
4. **Documentation** — portfolio quality, this is half the value of the project:
   - README per PRD's 17-section spec (overview → ROI framework). Screenshot placeholders with exact capture instructions.
   - Complete docs/: architecture.md (incl. SQLite→Postgres swap path, mock→real provider swap path), data-model.md, intelligence-engine.md, ai-safety-and-grounding.md, demo-scenario.md, consulting-implementation.md (discovery → data access → KPI definition → implementation → validation → adoption → optimization for a real DTC client), implementation-roadmap.md final status.
   - ROI model: editable assumptions in a simple settings/doc table (hours saved, stockout exposure, wasted spend detection speed). No guaranteed-revenue claims.
5. Demo script: `docs/demo-scenario.md` gets a 5-minute walkthrough section.

Final review (Fable 5): adversarial pass on the whole repo — would a senior engineer at a DTC brand's agency trust this codebase? Fix material findings only.
