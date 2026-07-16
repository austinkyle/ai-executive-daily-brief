import { describe, expect, it } from "vitest";

import * as schema from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/test-db";

import { persistFindings } from "./findings";
import { SEVERITY_WEIGHT } from "./prioritize";
import type { FindingDraft } from "./types";

const draft = (ruleId: string, severity: FindingDraft["severity"], magnitude: number, confidence: number, evidenceMetricIds: string[]): FindingDraft => ({ ruleId, severity, magnitude, confidence, evidenceMetricIds, domain: "commerce", entityType: "sku", entityId: "sku-1", date: "2026-07-16", title: "Title", whatChanged: "Changed", whyItMatters: "Matters", recommendedNextStep: "Act" });

describe("persistFindings", () => {
  it("persists evidence and calculated scores", () => {
    const { db, sqlite } = createTestDb();
    try {
      db.insert(schema.organizations).values({ id: "org-1", name: "Test", createdAt: new Date("2026-07-16") }).run();
      const drafts = [draft("one", "critical", 1.5, 0.9, ["m1", "m2"]), draft("two", "opportunity", 2, 0.75, ["m3"]), draft("three", "info", 4, 0.5, [])];
      const saved = persistFindings(db, "org-1", drafts);
      expect(saved).toHaveLength(drafts.length);
      saved.forEach((row, index) => {
        const source = drafts[index]!;
        expect(row.evidenceMetricRefs).toEqual(source.evidenceMetricIds);
        expect(row.score).toBe(SEVERITY_WEIGHT[source.severity] * source.magnitude * source.confidence);
      });
      expect(db.select().from(schema.findings).all()).toHaveLength(drafts.length);
    } finally { sqlite.close(); }
  });
  it("returns an empty array without inserting empty drafts", () => {
    const { db, sqlite } = createTestDb();
    try {
      expect(persistFindings(db, "org-1", [])).toEqual([]);
      expect(db.select().from(schema.findings).all()).toHaveLength(0);
    } finally { sqlite.close(); }
  });
});
