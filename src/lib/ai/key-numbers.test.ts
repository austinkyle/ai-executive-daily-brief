import { describe, expect, it } from "vitest";

import * as schema from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/test-db";

import { buildKeyNumbers } from "./key-numbers";
import type { FindingForPrompt } from "./types";

type FindingWithEvidence = FindingForPrompt & { evidenceMetricRefs: string[] };

function finding(id: string, score: number, evidenceMetricRefs: string[]): FindingWithEvidence {
  return {
    id,
    domain: "commerce",
    severity: "warning",
    title: "Order trend changed",
    whatChanged: "Verified order volume moved outside its expected range.",
    whyItMatters: "This may affect daily revenue performance.",
    recommendedNextStep: "Review the affected sales channel.",
    confidence: 0.9,
    score,
    evidenceMetricRefs,
  };
}

describe("buildKeyNumbers", () => {
  it("uses each top finding's latest metric and produces readable keys", async () => {
    const { db, sqlite } = createTestDb();
    try {
      db.insert(schema.metrics)
        .values([
          {
            id: "metric-orders",
            orgId: "org-1",
            date: "2026-07-16",
            domain: "commerce",
            metricKey: "orders",
            entityType: "org",
            entityId: "blended-account",
            value: 125,
            unit: "orders",
          },
          {
            id: "metric-campaign",
            orgId: "org-1",
            date: "2026-07-16",
            domain: "marketing",
            metricKey: "spend",
            entityType: "campaign",
            entityId: "campaign-summer",
            value: 4200,
            unit: "usd",
          },
        ])
        .run();

      const result = await buildKeyNumbers(db, [
        finding("finding-orders", 95, ["metric-old", "metric-orders"]),
        finding("finding-campaign", 80, ["metric-campaign"]),
      ]);

      expect(result).toEqual({ orders: 125, "spend_campaign-summer": 4200 });
    } finally {
      sqlite.close();
    }
  });

  it("silently skips findings whose latest metric does not exist", async () => {
    const { db, sqlite } = createTestDb();
    try {
      await expect(
        buildKeyNumbers(db, [finding("finding-missing", 90, ["missing-metric"])]),
      ).resolves.toEqual({});
    } finally {
      sqlite.close();
    }
  });
});
