import { inArray } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "@/lib/db/schema";

import type { FindingForPrompt } from "./types";

type FindingWithEvidence = FindingForPrompt & {
  evidenceMetricRefs: string[];
};

const GENERIC_ENTITY_IDS = new Set([
  "blended-account",
  "account",
  "all",
  "none",
  "unknown",
]);

function isGenericEntity(entityType: string, entityId: string): boolean {
  return entityType === "org" || GENERIC_ENTITY_IDS.has(entityId.toLowerCase());
}

export async function buildKeyNumbers(
  db: BetterSQLite3Database<typeof schema>,
  findings: FindingWithEvidence[],
): Promise<Record<string, number>> {
  const metricIds = [...findings]
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((finding) => finding.evidenceMetricRefs.at(-1))
    .filter((id): id is string => id !== undefined);

  if (metricIds.length === 0) return {};

  const metricRows = db
    .select()
    .from(schema.metrics)
    .where(inArray(schema.metrics.id, [...new Set(metricIds)]))
    .all();
  const metricsById = new Map(metricRows.map((metric) => [metric.id, metric]));
  const result: Record<string, number> = {};

  for (const metricId of metricIds) {
    const metric = metricsById.get(metricId);
    if (!metric) continue;
    const key = isGenericEntity(metric.entityType, metric.entityId)
      ? metric.metricKey
      : `${metric.metricKey}_${metric.entityId}`;
    if (!(key in result)) result[key] = metric.value;
  }

  return result;
}
