import { describe, expect, it } from "vitest";

import * as schema from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/test-db";

import { simulateDelivery } from "./simulate-delivery";

const brief = {
  id: "brief-1", orgId: "org-1", date: "2026-07-16", status: "generated", overallStatus: "strong",
  executiveSummary: "Summary", wins: [], risks: [], opportunities: [], recommendedActions: [], keyNumbers: {},
  evidenceFindingRefs: [], confidence: 0.95, promptVersion: "test", model: "test", isFallback: true,
  generatedAt: new Date("2026-07-16"),
};

describe("simulateDelivery", () => {
  it("sends email and slack once per brief", () => {
    const { db, sqlite } = createTestDb();
    try {
      db.insert(schema.organizations).values({ id: "org-1", name: "Test", createdAt: new Date("2026-07-16") }).run();
      db.insert(schema.briefs).values(brief).run();

      const first = simulateDelivery(db, brief.id);
      const second = simulateDelivery(db, brief.id);

      expect(first).toHaveLength(2);
      expect(first.map((delivery) => delivery.channel).sort()).toEqual(["email", "slack"]);
      expect(first.every((delivery) => delivery.status === "sent")).toBe(true);
      expect(second).toEqual(first);
      expect(db.select().from(schema.deliveries).all()).toHaveLength(2);
    } finally { sqlite.close(); }
  });
});
