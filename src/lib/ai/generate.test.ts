import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import * as schema from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/test-db";

import { generateBrief } from "./generate";
import { FallbackLlmClient } from "./llm-client";
import { PROMPT_VERSION } from "./prompt";

const org = {
  id: "org-1",
  name: "Northbound Supply Co.",
  createdAt: new Date(),
};

describe("generateBrief", () => {
  it("generates a fallback brief grounded in the seeded findings", async () => {
    const { db, sqlite } = createTestDb();
    try {
      db.insert(schema.organizations).values(org).run();
      db.insert(schema.metrics)
        .values([
          {
            id: "metric-1", orgId: "org-1", date: "2026-07-16", domain: "commerce",
            metricKey: "checkout_conversion", entityType: "org", entityId: "org-1", value: 2.1, unit: "percent",
          },
          {
            id: "metric-2", orgId: "org-1", date: "2026-07-16", domain: "support",
            metricKey: "open_tickets", entityType: "org", entityId: "org-1", value: 187, unit: "tickets",
          },
          {
            id: "metric-3", orgId: "org-1", date: "2026-07-16", domain: "email",
            metricKey: "repeat_revenue", entityType: "org", entityId: "org-1", value: 18400, unit: "usd",
          },
        ])
        .run();
      db.insert(schema.findings)
        .values([
          {
            id: "finding-critical", orgId: "org-1", date: "2026-07-16", domain: "commerce", severity: "critical",
            title: "Checkout conversion decline",
            whatChanged: "Checkout conversion fell 34 percent below its seven-day baseline after the latest storefront release.",
            whyItMatters: "The decline directly reduces completed orders from customers who have already demonstrated purchase intent.",
            recommendedNextStep: "Audit checkout errors and payment-provider failures immediately.",
            confidence: 0.95, score: 98, evidenceMetricRefs: ["metric-1"],
          },
          {
            id: "finding-warning", orgId: "org-1", date: "2026-07-16", domain: "support", severity: "warning",
            title: "Support backlog growing",
            whatChanged: "Open support tickets rose 22 percent above the normal operating range during the afternoon.",
            whyItMatters: "Longer response times can increase refund requests and damage customer retention.",
            recommendedNextStep: "Rebalance staffing toward the highest-volume support queue this week.",
            confidence: 0.88, score: 76, evidenceMetricRefs: ["metric-2"],
          },
          {
            id: "finding-opportunity", orgId: "org-1", date: "2026-07-16", domain: "email", severity: "opportunity",
            title: "Repeat purchase segment accelerating",
            whatChanged: "Revenue from returning customers accelerated 18 percent after the replenishment email campaign launched.",
            whyItMatters: "The segment offers a credible near-term path to incremental revenue at an efficient acquisition cost.",
            recommendedNextStep: "Expand the highest-performing returning-customer email sequence.",
            confidence: 0.91, score: 84, evidenceMetricRefs: ["metric-3"],
          },
        ])
        .run();

      const result = await generateBrief(db, "org-1", "2026-07-16", new FallbackLlmClient());
      const findingIds = new Set(["finding-critical", "finding-warning", "finding-opportunity"]);

      expect(result.isFallback).toBe(true);
      expect(result.promptVersion).toBe(PROMPT_VERSION);
      expect(result.model).toBe("deterministic-fallback");
      expect(result.overallStatus).toBe("at_risk");
      expect(result.evidenceFindingRefs.length).toBeGreaterThan(0);
      expect(result.evidenceFindingRefs.every((id) => findingIds.has(id))).toBe(true);
      expect(result.recommendedActions.length).toBeGreaterThan(0);
      expect(result.recommendedActions.length).toBeLessThanOrEqual(5);
      expect(result.executiveSummary.length).toBeGreaterThan(40);
      expect(Object.keys(result.keyNumbers).length).toBeGreaterThan(0);
      expect(
        db.select().from(schema.briefs).where(eq(schema.briefs.orgId, "org-1")).all(),
      ).toHaveLength(1);
    } finally {
      sqlite.close();
    }
  });

  it("produces a quiet-day brief when no findings exist", async () => {
    const { db, sqlite } = createTestDb();
    try {
      db.insert(schema.organizations).values(org).run();

      const result = await generateBrief(db, "org-1", "2026-07-17", new FallbackLlmClient());

      expect(result.overallStatus).toBe("strong");
      expect(result.evidenceFindingRefs).toEqual([]);
      expect(result.recommendedActions).toEqual([]);
      expect(result.keyNumbers).toEqual({});
      expect(result.isFallback).toBe(true);
    } finally {
      sqlite.close();
    }
  });
});
