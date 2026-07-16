# Workflow 04 — AI Brief Generation (GPT 5.6 Terra; Fable 5 for prompt design review)

Context: CLAUDE.md + workspaces/ai/context.md.

Implement:
1. **LLM abstraction**: `LlmClient` interface; OpenAI-compatible fetch implementation (no SDK dependency — raw fetch keeps it light); deterministic fallback implementation.
2. **Brief schema** (Zod): overall_status, executive_summary, wins[], risks[], opportunities[], recommended_actions[] (ranked, specific), key_numbers, evidence_refs[] (finding IDs), confidence.
3. **Prompt template** (versioned, stored constant): system prompt instructs — narrate ONLY the provided findings, cite finding IDs, distinguish verified facts / calculated findings / hypotheses / recommended investigations, ban generic advice ("continue monitoring"), ban unsupported financial claims.
4. **Generation pipeline**: findings in → schema-validated → LLM → parse → Zod validate → **evidence enforcement** (reject any evidence_ref not in input finding IDs) → one retry with error feedback → fallback on failure.
5. **Deterministic fallback**: template-based narrative assembled from top-ranked findings so the demo is fully functional keyless. Make it genuinely good — this is what most demo viewers will see.
6. **Persistence**: briefs table stores structured output + prompt_version + model + generation metadata.
7. Tests: schema validation, evidence-ref rejection, fallback output for the seeded scenario.

Ritual per CLAUDE.md.
