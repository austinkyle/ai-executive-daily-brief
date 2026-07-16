# AI Safety & Grounding

## Grounding principle

Brief generation is a narration layer over the deterministic intelligence pipeline, not a second analytics engine. The LLM and deterministic fallback receive only `FindingForPrompt` objects through `buildUserPrompt()` in `src/lib/ai/prompt.ts`. Each object is limited to a finding's `id`, `domain`, `severity`, `title`, `whatChanged`, `whyItMatters`, `recommendedNextStep`, `confidence`, and `score`. They never receive raw `metrics` rows. This boundary means the narrative can explain prioritized, reviewed findings but cannot discover facts from unbounded source data.

## Evidence enforcement

`generateBrief()` in `src/lib/ai/generate.ts` builds the valid finding-ID set from the input organization and date, then validates every `evidence_refs` entry returned by a client against that set. An unknown ID causes a plain error listing the offending IDs. This is a hard reject, never a soft warning: the invalid output is not persisted and enters the retry-then-fallback flow.

## Claim taxonomy

`SYSTEM_PROMPT` in `src/lib/ai/prompt.ts` instructs the model to distinguish verified facts, calculated findings, plausible hypotheses, and recommended investigations in its prose. This is prompt-level discipline, not field-by-field programmatic classification. The `briefs` schema stores prose strings in its wins, risks, and opportunities arrays rather than structured per-claim-type fields; the earlier open question is therefore resolved in favor of clear language within the existing narrative fields.

## Prohibited content

The system prompt prohibits generic advice such as “continue monitoring performance” and unsupported financial figures. Those constraints are enforced by the prompt on the real-LLM path. The deterministic fallback in `src/lib/ai/fallback-templates.ts` is structurally protected: each sentence is assembled from the finding's already-reviewed text fields, so it cannot introduce generic advice or an unsupported figure of its own.

## Deterministic key numbers

`key_numbers` is computed deterministically and is never LLM-authored. This is a deliberate design decision. After narrative generation, `buildKeyNumbers()` in `src/lib/ai/key-numbers.ts` reads the real `metrics` rows referenced by the highest-priority findings' evidence and constructs the scorecard directly from those rows. The result is merged into the persisted brief separately from the narrative, keeping every numeric claim traceable to a metric row regardless of whether the narrative came from an LLM or the fallback.

## Schema validation, retry, and fallback

`BriefContentSchema` in `src/lib/ai/schema.ts` validates real-LLM output with Zod. A schema or evidence-validation error is supplied to one retry as `retryFeedback`. A second failure, or the normal case where no `LLM_API_KEY` is configured, uses `FallbackLlmClient`. The fallback templates in `fallback-templates.ts` are a first-class generation path, not a degraded error state.

## Prompt versioning

`PROMPT_VERSION` in `src/lib/ai/prompt.ts` is persisted in the `promptVersion` column for every generated brief. This applies equally to LLM and fallback output, so historical briefs retain the generation-contract version associated with their run.

## Credentials handling

`LLM_API_KEY` in `src/lib/env.ts` is optional. Its absence is a normal, fully supported operating mode that selects the deterministic fallback client. The key is never logged.
