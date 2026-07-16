import type { FindingDraft, Severity } from "./types";

export const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 4, warning: 3, opportunity: 2, info: 1 };

export function scoreFinding(draft: FindingDraft): number {
  return SEVERITY_WEIGHT[draft.severity] * draft.magnitude * draft.confidence;
}

export function prioritizeFindings(drafts: FindingDraft[]): (FindingDraft & { score: number })[] {
  return drafts.map((draft) => ({ ...draft, score: scoreFinding(draft) })).sort((a, b) => b.score - a.score);
}
