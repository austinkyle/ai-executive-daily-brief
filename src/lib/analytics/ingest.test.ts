import { afterEach, describe, expect, it } from "vitest";

import * as schema from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/test-db";
import { gorgiasMockProvider } from "@/lib/integrations/gorgias-mock";
import { googleAdsMockProvider } from "@/lib/integrations/google-ads-mock";
import { inventoryMockProvider } from "@/lib/integrations/inventory-mock";
import { klaviyoMockProvider } from "@/lib/integrations/klaviyo-mock";
import { metaMockProvider } from "@/lib/integrations/meta-mock";
import type { DataProvider } from "@/lib/integrations/provider";
import {
  dateForDayIndex,
  generateScenario,
} from "@/lib/integrations/scenario-generator";
import { shopifyMockProvider } from "@/lib/integrations/shopify-mock";

import { ingestProviderDay, ingestProvidersForDates } from "./ingest";

const orgId = "test-org";
const providers: DataProvider[] = [
  shopifyMockProvider,
  metaMockProvider,
  googleAdsMockProvider,
  klaviyoMockProvider,
  gorgiasMockProvider,
  inventoryMockProvider,
];

let closeSqlite: (() => void) | undefined;

afterEach(() => {
  closeSqlite?.();
  closeSqlite = undefined;
});

function setup() {
  const { db, sqlite } = createTestDb();
  closeSqlite = () => sqlite.close();
  db.insert(schema.organizations)
    .values({ id: orgId, name: "Test Organization", createdAt: new Date() })
    .run();

  const entries = providers.map((provider, index) => ({
    connectionId: `connection-${index}`,
    provider,
  }));
  db.insert(schema.dataConnections)
    .values(
      entries.map((entry) => ({
        id: entry.connectionId,
        orgId,
        providerKey: entry.provider.providerKey,
        displayName: entry.provider.providerKey,
        isSimulated: true,
        status: "connected",
      })),
    )
    .run();

  return { db, entries };
}

describe("ingestion", () => {
  it("ingests all providers for one date", () => {
    const { db, entries } = setup();
    const date = "2026-06-20";

    ingestProvidersForDates(db, orgId, entries, [date]);

    const syncRuns = db.select().from(schema.syncRuns).all();
    const metrics = db.select().from(schema.metrics).all();
    expect(syncRuns.filter((run) => run.runDate === date)).toHaveLength(6);
    expect(metrics.filter((metric) => metric.date === date)).toHaveLength(
      generateScenario().filter((metric) => metric.date === date).length,
    );
  });

  it("ingests all providers across the scenario window", () => {
    const { db, entries } = setup();
    const dates = Array.from({ length: 30 }, (_, index) => dateForDayIndex(index));

    ingestProvidersForDates(db, orgId, entries, dates);

    expect(db.select().from(schema.metrics).all()).toHaveLength(
      generateScenario().length,
    );
    expect(db.select().from(schema.syncRuns).all()).toHaveLength(180);
  });

  it("records an empty sync run for a date outside the scenario", () => {
    const { db, entries } = setup();
    const date = "2026-08-01";
    const result = ingestProviderDay(
      db,
      orgId,
      entries[0]!.connectionId,
      shopifyMockProvider,
      date,
    );

    expect(result.metricsInserted).toBe(0);
    expect(db.select().from(schema.syncRuns).all()).toHaveLength(1);
    expect(
      db.select().from(schema.metrics).all().filter((metric) => metric.date === date),
    ).toHaveLength(0);
  });
});
