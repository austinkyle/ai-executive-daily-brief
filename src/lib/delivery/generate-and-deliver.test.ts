import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import * as schema from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/test-db";

import { generateAndDeliverBrief } from "./generate-and-deliver";

const orgId = "org-1";
const date = "2026-07-16";

describe("generateAndDeliverBrief", () => {
  it("generates and delivers once for an organization date", async () => {
    const { db, sqlite } = createTestDb();
    try {
      db.insert(schema.organizations).values({ id: orgId, name: "Test", createdAt: new Date(date) }).run();
      db.insert(schema.metrics).values({
        id: "metric-1", orgId, date, domain: "commerce", metricKey: "net_sales", entityType: "org", entityId: orgId, value: 12000, unit: "usd",
      }).run();
      db.insert(schema.findings).values({
        id: "finding-1", orgId, date, domain: "commerce", severity: "warning", title: "Sales slowed",
        whatChanged: "Sales declined against the baseline.", whyItMatters: "Revenue may miss plan.",
        recommendedNextStep: "Review the sales funnel.", confidence: 0.9, score: 80, evidenceMetricRefs: ["metric-1"],
      }).run();

      const first = await generateAndDeliverBrief(db, orgId, date);
      const second = await generateAndDeliverBrief(db, orgId, date);

      expect(first.brief.isFallback).toBe(true);
      expect(first.deliveries).toHaveLength(2);
      expect(second.brief.id).toBe(first.brief.id);
      expect(second.deliveries).toEqual(first.deliveries);
      expect(db.select().from(schema.briefs).where(and(eq(schema.briefs.orgId, orgId), eq(schema.briefs.date, date))).all()).toHaveLength(1);
      expect(db.select().from(schema.deliveries).where(eq(schema.deliveries.briefId, first.brief.id)).all()).toHaveLength(2);
    } finally { sqlite.close(); }
  });
});
