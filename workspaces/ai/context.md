# ai workspace context

## Domain scope
Owns the narrative layer: the LLM client abstraction, prompt template, structured output schema, evidence enforcement, retry/fallback logic, and brief persistence. Consumes only the `intelligence` workspace's ranked `Finding[]` — never raw metrics, per the PRD's grounding requirement (see `docs/ai-safety-and-grounding.md`).

## Key files planned
- `src/lib/ai/llm-client.ts` — `LlmClient` interface + two implementations: raw-`fetch` OpenAI-compatible client (used when `LLM_API_KEY` is set) and a deterministic template-based fallback (used otherwise, or when the LLM path fails after retry).
- `src/lib/ai/schema.ts` — Zod brief schema: `overall_status, executive_summary, wins[], risks[], opportunities[], recommended_actions[], key_numbers, evidence_refs[], confidence`.
- `src/lib/ai/prompt.ts` — versioned system prompt constant (`PROMPT_VERSION`). Instructs: narrate only provided findings, cite finding IDs, distinguish verified fact / calculated finding / hypothesis / recommended investigation, ban generic advice and unsupported financial claims.
- `src/lib/ai/generate.ts` — the full pipeline: findings in → input validation → LLM call → parse → Zod validate → evidence enforcement (reject `evidence_ref`s outside the input finding-ID set) → one retry with error feedback → fallback → persist to `briefs`.
- `src/lib/ai/fallback-templates.ts` — the deterministic narrative templates. Treated as a first-class deliverable, not a degraded path.

## Interfaces owned
- `LlmClient` interface — how a future real model swap or provider change happens without touching `generate.ts`.
- The brief `Zod` schema — the contract the `web` workspace's Today's Brief view renders against.

## Decisions from Workflow 01
- The deterministic fallback must be genuinely good, not a last-resort branch — most demo viewers without an API key will only ever see this path.
- Evidence enforcement is a hard reject-and-retry, not a soft warning: any `evidence_ref` not present in the input finding-ID set fails validation.
- One retry only, with the validation error fed back to the model; second failure or no-key falls straight to the deterministic fallback.

## Open items
- Exact fallback template wording/structure — design in Phase 4, review by orchestrator before Terra implements the rest of the pipeline around it.
- Nothing implemented yet — starts in Phase 4 (`workflows/04-ai-brief.md`), after Phase 3's findings exist.
