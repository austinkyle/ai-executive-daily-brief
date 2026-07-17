import { randomUUID } from "node:crypto";

import { ingestProvidersForDates } from "../analytics/ingest";
import { generateBrief } from "../ai/generate";
import { detectAnomalies } from "../intelligence/anomaly";
import { evaluateCrossDomainRules } from "../intelligence/cross-domain";
import { persistFindings } from "../intelligence/findings";
import { groupMetricsIntoSeries } from "../intelligence/group-metrics";
import { prioritizeFindings } from "../intelligence/prioritize";
import { evaluateRules, PRODUCTION_RULES } from "../intelligence/rules";
import { gorgiasMockProvider } from "../integrations/gorgias-mock";
import { googleAdsMockProvider } from "../integrations/google-ads-mock";
import { inventoryMockProvider } from "../integrations/inventory-mock";
import { klaviyoMockProvider } from "../integrations/klaviyo-mock";
import { metaMockProvider } from "../integrations/meta-mock";
import { dateForDayIndex } from "../integrations/scenario-generator";
import { shopifyMockProvider } from "../integrations/shopify-mock";
import { logger } from "../logger";
import { createPrng, randInt } from "../util/prng";
import db from "./client";
import {
  briefs,
  dataConnections,
  deliveries,
  findings,
  memberships,
  metrics,
  organizations,
  syncRuns,
  targets,
  users,
} from "./schema";

const SEED = 42;
const rng = createPrng(SEED);
const createdAt = new Date(Date.UTC(2026, 0, 1, 0, randInt(rng, 0, 59)));

const connections = [
  { providerKey: "shopify", displayName: "Shopify Store" },
  { providerKey: "meta", displayName: "Meta Ads" },
  { providerKey: "google-ads", displayName: "Google Ads" },
  { providerKey: "klaviyo", displayName: "Klaviyo" },
  { providerKey: "gorgias", displayName: "Gorgias Support" },
  { providerKey: "inventory", displayName: "Inventory" },
] as const;

const providers = {
  shopify: shopifyMockProvider,
  meta: metaMockProvider,
  "google-ads": googleAdsMockProvider,
  klaviyo: klaviyoMockProvider,
  gorgias: gorgiasMockProvider,
  inventory: inventoryMockProvider,
};

async function seed(): Promise<void> {
  logger.info("Starting demo database seed", { seed: SEED });

  // UUIDs are intentionally random valid row identifiers; the PRNG drives reproducible seed data.
  const organizationId = randomUUID();
  const userId = randomUUID();
  const connectionRows = connections.map((connection) => ({
    id: randomUUID(),
    orgId: organizationId,
    ...connection,
    isSimulated: true,
    status: "connected",
    lastSyncedAt: null,
    credentialsRef: "simulated",
  }));

  db.transaction((tx) => {
    logger.info("Clearing existing demo entities");
    tx.delete(deliveries).run();
    tx.delete(briefs).run();
    tx.delete(findings).run();
    tx.delete(syncRuns).run();
    tx.delete(metrics).run();
    tx.delete(targets).run();
    tx.delete(dataConnections).run();
    tx.delete(memberships).run();
    tx.delete(users).run();
    tx.delete(organizations).run();

    tx.insert(organizations)
      .values({ id: organizationId, name: "Northbound Supply Co.", createdAt })
      .run();
    tx.insert(users)
      .values({
        id: userId,
        email: "alex.morgan@northboundsupply.example",
        name: "Alex Morgan",
        createdAt,
      })
      .run();
    tx.insert(memberships)
      .values({ id: randomUUID(), orgId: organizationId, userId, role: "owner" })
      .run();
    tx.insert(dataConnections).values(connectionRows).run();
  });

  const dates = Array.from({ length: 30 }, (_, index) => dateForDayIndex(index));
  const entries = connectionRows.map((connection) => ({
    connectionId: connection.id,
    provider: providers[connection.providerKey],
  }));
  ingestProvidersForDates(db, organizationId, entries, dates);

  const groups = groupMetricsIntoSeries(db.select().from(metrics).all());
  for (const date of dates) {
    const drafts = [
      ...evaluateRules(PRODUCTION_RULES, groups, date),
      ...detectAnomalies(groups, date),
      ...evaluateCrossDomainRules(groups, date),
    ];
    const scored = prioritizeFindings(drafts);
    persistFindings(db, organizationId, scored);
  }

  const metricRows = db.select().from(metrics).all();
  const juneDates = new Set(dates.slice(0, 14));
  const julyDates = new Set(dates.slice(14));
  const sumMetrics = (domain: string, metricKey: string, datesForMonth: Set<string>) =>
    metricRows
      .filter(
        (metric) =>
          metric.domain === domain &&
          metric.metricKey === metricKey &&
          metric.entityType === (metricKey === "gross_sales" ? "org" : "campaign") &&
          datesForMonth.has(metric.date),
      )
      .reduce((sum, metric) => sum + metric.value, 0);

  const juneGrossSalesActual = sumMetrics("commerce", "gross_sales", juneDates);
  const julyGrossSalesActual = sumMetrics("commerce", "gross_sales", julyDates);
  const juneSpendActual = sumMetrics("marketing", "spend", juneDates);
  const julySpendActual = sumMetrics("marketing", "spend", julyDates);
  db.insert(targets)
    .values([
      { id: randomUUID(), orgId: organizationId, metricKey: "gross_sales", month: "2026-06", targetValue: juneGrossSalesActual * 0.97 },
      { id: randomUUID(), orgId: organizationId, metricKey: "gross_sales", month: "2026-07", targetValue: julyGrossSalesActual * 1.08 },
      { id: randomUUID(), orgId: organizationId, metricKey: "spend", month: "2026-06", targetValue: juneSpendActual * 0.97 },
      { id: randomUUID(), orgId: organizationId, metricKey: "spend", month: "2026-07", targetValue: julySpendActual * 1.08 },
    ])
    .run();

  for (const date of dates.slice(0, 29)) {
    await generateBrief(db, organizationId, date);
  }

  logger.info("Demo database seed complete", {
    organizations: 1,
    users: 1,
    memberships: 1,
    dataConnections: db.select().from(dataConnections).all().length,
    metrics: db.select().from(metrics).all().length,
    findings: db.select().from(findings).all().length,
    targets: db.select().from(targets).all().length,
    briefs: db.select().from(briefs).all().length,
  });
}

seed()
  .then(() => {})
  .catch((error) => {
    logger.error("Demo database seed failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  });
