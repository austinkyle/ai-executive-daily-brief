import { describe, expect, it } from "vitest";

import { buildFallbackContent } from "./fallback-templates";
import type { FindingForPrompt } from "./types";

const critical: FindingForPrompt = {
  id: "finding-critical",
  domain: "commerce",
  severity: "critical",
  title: "Checkout conversion decline",
  whatChanged: "Verified checkout conversion fell materially below its recent baseline.",
  whyItMatters: "This directly reduces completed orders from otherwise qualified traffic.",
  recommendedNextStep: "Audit checkout errors and payment-provider failures immediately.",
  confidence: 0.94,
  score: 98,
};

const warning: FindingForPrompt = {
  id: "finding-warning",
  domain: "support",
  severity: "warning",
  title: "Support backlog growing",
  whatChanged: "Calculated open support volume rose above the operating threshold.",
  whyItMatters: "Longer response times can increase refund requests and customer churn.",
  recommendedNextStep: "Rebalance staffing toward the highest-volume support queue.",
  confidence: 0.88,
  score: 76,
};

const opportunity: FindingForPrompt = {
  id: "finding-opportunity",
  domain: "email",
  severity: "opportunity",
  title: "Repeat purchase segment accelerating",
  whatChanged: "Verified repeat-purchase revenue accelerated in the returning-customer segment.",
  whyItMatters: "The segment offers a credible near-term path to incremental revenue.",
  recommendedNextStep: "Expand the highest-performing returning-customer email sequence.",
  confidence: 0.91,
  score: 84,
};

describe("buildFallbackContent", () => {
  it("builds a prioritized brief from mixed findings", () => {
    const content = buildFallbackContent([warning, opportunity, critical]);
    const fixtureIds = new Set([critical.id, warning.id, opportunity.id]);

    expect(content.risks).toHaveLength(2);
    expect(content.wins).toHaveLength(1);
    expect(content.opportunities).toHaveLength(1);
    expect(content.recommended_actions.length).toBeLessThanOrEqual(5);
    expect(content.recommended_actions.every((action) => /^(Immediately: |This week: |Consider: )/.test(action))).toBe(true);
    expect(content.overall_status).toBe("at_risk");
    expect(content.evidence_refs.length).toBeGreaterThan(0);
    expect(content.evidence_refs.every((id) => fixtureIds.has(id))).toBe(true);
  });

  it("marks critical-only findings as at risk", () => {
    expect(buildFallbackContent([critical]).overall_status).toBe("at_risk");
  });

  it("presents opportunity-only findings as strong", () => {
    const content = buildFallbackContent([opportunity]);

    expect(content.overall_status).toBe("strong");
    expect(content.risks).toHaveLength(0);
    expect(content.wins.length).toBeGreaterThan(0);
    expect(content.opportunities.length).toBeGreaterThan(0);
  });

  it("returns the exact quiet-day content", () => {
    const content = buildFallbackContent([]);

    expect(content).toEqual({
      overall_status: "strong",
      executive_summary:
        "No significant anomalies or threshold breaches were detected across commerce, marketing, email, support, or inventory today; performance remained within normal ranges.",
      wins: [
        "No metrics breached alert thresholds, indicating stable execution across all tracked channels.",
      ],
      risks: [],
      opportunities: [],
      recommended_actions: [],
      evidence_refs: [],
      confidence: 0.95,
    });
    expect(content.executive_summary).not.toMatch(/continue monitoring/i);
  });
});
