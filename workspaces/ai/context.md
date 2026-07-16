# ai workspace context

## Domain scope
Owns the narrative layer: the LLM client abstraction, prompt template, structured output schema, evidence enforcement, retry/fallback logic, deterministic key-number construction, and brief persistence. It consumes ranked intelligence findings for narrative generation and never exposes raw metrics to a generation client, per the grounding requirement in `docs/ai-safety-and-grounding.md`.

## Key files planned
- `src/lib/ai/types.ts` — narrow `FindingForPrompt` contract used at the client boundary.
- `src/lib/ai/schema.ts` — Zod brief-content contract for the narrative fields.
- `src/lib/ai/prompt.ts` — versioned system and user prompts (`PROMPT_VERSION`).
- `src/lib/ai/fallback-templates.ts` — deterministic, first-class brief narrative templates.
- `src/lib/ai/llm-client.ts` — `LlmClient` interface plus OpenAI-compatible and fallback implementations.
- `src/lib/ai/key-numbers.ts` — deterministic scorecard values built from evidence-linked metric rows.
- `src/lib/ai/generate.ts` — findings query, narrow client input, evidence enforcement, retry/fallback, key-number merge, and `briefs` persistence.
- Tests: `schema.test.ts`, `fallback-templates.test.ts`, `key-numbers.test.ts`, and `generate.test.ts`.

## Interfaces owned
- `LlmClient` — the provider boundary that permits a future model/provider swap without changing `generate.ts`.
- The brief Zod schema — the narrative-content contract rendered by the web workspace.

## Decisions from Workflow 01
- The deterministic fallback must be genuinely good, not a last-resort branch — most demo viewers without an API key will only ever see this path.
- Evidence enforcement is a hard reject-and-retry, not a soft warning: any `evidence_refs` value outside the input finding-ID set fails validation.
- One retry only, with the validation or evidence error fed back to the model; second failure or no key falls straight to the deterministic fallback.

## Decisions from Workflow 04
- Phase 4 is implemented.
- `key_numbers` is computed by `key-numbers.ts` from real evidence-linked `metrics` rows, never authored by the LLM.
- `overall_status` uses `strong | stable | mixed | at_risk`, derived deterministically from severity counts in the fallback and expected in the same form from LLM output.
- The `briefs.status` column is persisted as the literal string `"generated"`.
- `src/lib/env.ts` gained additive `LLM_MODEL`, defaulting to `"gpt-4o-mini"`; that file remains owned by the database workspace.

## Open items

None for Phase 4. Future prompt or provider changes must preserve the narrow finding boundary, evidence validation, deterministic key-number path, and persisted prompt version.
