import { randomUUID } from "node:crypto";

import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "@/lib/db/schema";
import type { DataProvider } from "@/lib/integrations/provider";

export interface IngestResult {
  syncRunId: string;
  metricsInserted: number;
}

export function ingestProviderDay(
  db: BetterSQLite3Database<typeof schema>,
  orgId: string,
  connectionId: string,
  provider: DataProvider,
  date: string,
): IngestResult {
  const syncRunId = randomUUID();
  const providerMetrics = provider.fetchDailyMetrics(date);
  const metricsRows = providerMetrics.map((metric) => ({
    id: randomUUID(),
    orgId,
    date: metric.date,
    domain: metric.domain,
    metricKey: metric.metricKey,
    entityType: metric.entityType,
    entityId: metric.entityId,
    value: metric.value,
    unit: metric.unit,
  }));

  db.transaction((tx) => {
    const now = new Date();
    tx.insert(schema.syncRuns)
      .values({
        id: syncRunId,
        connectionId,
        orgId,
        runDate: date,
        status: "success",
        startedAt: now,
        finishedAt: now,
      })
      .run();

    if (metricsRows.length > 0) {
      tx.insert(schema.metrics).values(metricsRows).run();
    }
  });

  return { syncRunId, metricsInserted: metricsRows.length };
}

export function ingestProvidersForDates(
  db: BetterSQLite3Database<typeof schema>,
  orgId: string,
  entries: { connectionId: string; provider: DataProvider }[],
  dates: string[],
): IngestResult[] {
  const results: IngestResult[] = [];

  for (const date of dates) {
    for (const entry of entries) {
      results.push(
        ingestProviderDay(db, orgId, entry.connectionId, entry.provider, date),
      );
    }
  }

  return results;
}
