import { randomUUID } from "node:crypto";

import * as schema from "@/lib/db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { scoreFinding } from "./prioritize";
import type { FindingDraft } from "./types";

export function persistFindings(db: BetterSQLite3Database<typeof schema>, orgId: string, drafts: FindingDraft[]): (typeof schema.findings.$inferSelect)[] {
  if (drafts.length === 0) return [];
  const rows = drafts.map((draft) => ({
    id: randomUUID(), orgId, date: draft.date, domain: draft.domain, severity: draft.severity,
    title: draft.title, whatChanged: draft.whatChanged, whyItMatters: draft.whyItMatters,
    confidence: draft.confidence, score: scoreFinding(draft), evidenceMetricRefs: draft.evidenceMetricIds,
    recommendedNextStep: draft.recommendedNextStep,
  }));
  return db.insert(schema.findings).values(rows).returning().all();
}
