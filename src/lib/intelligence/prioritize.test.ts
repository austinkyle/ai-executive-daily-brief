import { describe, expect, it } from "vitest";

import { prioritizeFindings, scoreFinding, SEVERITY_WEIGHT } from "./prioritize";
import type { FindingDraft } from "./types";

const draft = (ruleId: string, severity: FindingDraft["severity"], magnitude: number, confidence: number): FindingDraft => ({ ruleId, severity, magnitude, confidence, domain: "commerce", entityType: "org", entityId: "org-1", date: "2026-07-16", title: "Title", whatChanged: "Changed", whyItMatters: "Matters", recommendedNextStep: "Act", evidenceMetricIds: [] });

describe("finding prioritization", () => {
  it("calculates the exact score", () => expect(scoreFinding(draft("exact", "warning", 2.5, 0.8))).toBe(6));
  it("sorts descending by score", () => {
    const findings = [draft("info", "info", 10, 0.5), draft("critical", "critical", 3, 0.9), draft("warning", "warning", 3, 0.8)];
    expect(prioritizeFindings(findings).map((finding) => finding.ruleId)).toEqual(["critical", "warning", "info"]);
  });
  it("attaches independently computed scores", () => {
    for (const finding of prioritizeFindings([draft("one", "opportunity", 1.5, 0.7), draft("two", "critical", 0.8, 0.95)])) expect(finding.score).toBe(SEVERITY_WEIGHT[finding.severity] * finding.magnitude * finding.confidence);
  });
});
