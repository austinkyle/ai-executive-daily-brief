# AI Safety & Grounding

Status: outline stub, written in Workflow 01. Full detail lands in Phase 4 (`workflows/04-ai-brief.md`), which owns this document.

## Outline

1. **Grounding principle** — the LLM never receives raw data; it receives only the top-ranked structured findings produced by the deterministic pipeline (`intelligence-engine.md`). It narrates, it does not discover.
2. **Evidence enforcement** — every `evidence_ref` in the model's structured output must reference a finding ID present in the input set; any reference to an ID outside that set is rejected before persistence, triggering one retry with the validation error fed back to the model.
3. **Claim taxonomy** — the prompt requires the model to distinguish verified facts, calculated findings, plausible hypotheses, and recommended investigations, and the brief schema/UI preserve that distinction rather than flattening it into undifferentiated prose.
4. **Prohibited content** — generic non-actionable advice ("continue monitoring performance") and unsupported financial claims (e.g., projected revenue figures not derived from a finding) are explicitly banned in the system prompt; note here how/whether that's also checked programmatically vs. relying on prompt compliance.
5. **Schema validation & retry/fallback** — Zod validation of the structured output, one retry on failure, deterministic template fallback on repeat failure or missing API key. Fallback behavior is a first-class path, not an error state — see `implementation-roadmap.md` §5.
6. **Prompt versioning** — `prompt_version` stored per generated brief; what changes when the prompt is revised and how older briefs remain interpretable.
7. **Credentials handling** — `LLM_API_KEY` is optional and never logged; no key present is a normal, fully-supported operating mode, not a degraded one.

To be completed in Phase 4.
