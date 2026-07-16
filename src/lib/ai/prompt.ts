import type { FindingForPrompt } from "./types";

export const PROMPT_VERSION = "brief-v1";

export const SYSTEM_PROMPT = `You are generating an executive daily business brief. Narrate ONLY the findings provided in the user message. Never invent facts, causes, or numbers not present in the given findings.

Every entry in evidence_refs must be a finding id copied exactly from the input set. Never invent an id, and never omit ids for claims you make.

In your prose, make clear which statements are verified facts directly from a finding, which are calculated or derived findings, which are plausible hypotheses, and which are recommended investigations. Do not flatten these into interchangeable statements.

Never write generic non-actionable advice such as "continue monitoring performance." Never state a financial figure or percentage that is not traceable to one of the given findings.

Output strict JSON only: no markdown code fences and no prose before or after. Match exactly this shape with snake_case keys: { overall_status, executive_summary, wins, risks, opportunities, recommended_actions, evidence_refs, confidence }. Do not include a key_numbers field.`;

export function buildUserPrompt(
  findings: FindingForPrompt[],
  retryFeedback?: string,
): string {
  const promptFindings = findings.map(
    ({
      id,
      domain,
      severity,
      title,
      whatChanged,
      whyItMatters,
      recommendedNextStep,
      confidence,
    }) => ({
      id,
      domain,
      severity,
      title,
      whatChanged,
      whyItMatters,
      recommendedNextStep,
      confidence,
    }),
  );
  const retryPrefix = retryFeedback
    ? `Your previous response was invalid: ${retryFeedback}\nFix it and return valid JSON only, matching the required shape exactly.\n\n`
    : "";

  return `${retryPrefix}Here are today's findings, as a JSON array. Generate the brief JSON described in your instructions, using only this data:\n\n${JSON.stringify(promptFindings)}`;
}
