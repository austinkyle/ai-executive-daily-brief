import { describe, expect, it } from "vitest";

import { BriefContentSchema } from "./schema";

const validBrief = {
  overall_status: "stable",
  executive_summary: "Performance is stable with one clear action.",
  wins: ["Retention improved."],
  risks: ["Response time increased."],
  opportunities: ["A repeat-purchase segment is expanding."],
  recommended_actions: ["Review the support queue."],
  evidence_refs: ["finding-1"],
  confidence: 0.82,
};

describe("BriefContentSchema", () => {
  it("parses a fully valid brief", () => {
    expect(BriefContentSchema.parse(validBrief)).toEqual(validBrief);
  });

  it("rejects a missing executive summary", () => {
    const { executive_summary, ...briefWithoutSummary } = validBrief;
    void executive_summary;
    expect(() => BriefContentSchema.parse(briefWithoutSummary)).toThrow();
  });

  it("rejects an invalid overall status", () => {
    expect(() => BriefContentSchema.parse({ ...validBrief, overall_status: "bad_value" })).toThrow();
  });

  it("rejects confidence above one", () => {
    expect(() => BriefContentSchema.parse({ ...validBrief, confidence: 1.5 })).toThrow();
  });

  it("rejects negative confidence", () => {
    expect(() => BriefContentSchema.parse({ ...validBrief, confidence: -0.1 })).toThrow();
  });

  it("accepts empty narrative arrays for a quiet day", () => {
    expect(
      BriefContentSchema.parse({
        ...validBrief,
        wins: [],
        risks: [],
        opportunities: [],
        recommended_actions: [],
        evidence_refs: [],
      }),
    ).toMatchObject({ wins: [], risks: [], opportunities: [], recommended_actions: [], evidence_refs: [] });
  });
});
