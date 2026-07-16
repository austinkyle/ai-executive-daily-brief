import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { windowTrend } from "@/lib/analytics/compare";
import { ingestProvidersForDates } from "@/lib/analytics/ingest";
import * as schema from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/test-db";
import { gorgiasMockProvider } from "@/lib/integrations/gorgias-mock";
import { googleAdsMockProvider } from "@/lib/integrations/google-ads-mock";
import { inventoryMockProvider } from "@/lib/integrations/inventory-mock";
import { klaviyoMockProvider } from "@/lib/integrations/klaviyo-mock";
import { metaMockProvider } from "@/lib/integrations/meta-mock";
import { dateForDayIndex } from "@/lib/integrations/scenario-generator";
import { shopifyMockProvider } from "@/lib/integrations/shopify-mock";

import { detectAnomalies } from "./anomaly";
import { evaluateCrossDomainRules } from "./cross-domain";
import { groupMetricsIntoSeries } from "./group-metrics";
import { evaluateRules, PRODUCTION_RULES } from "./rules";
import type { FindingDraft, MetricSeriesGroup } from "./types";

const ASOF = "2026-07-16";

let groups: MetricSeriesGroup[];
let ruleFindings: FindingDraft[];
let crossDomainFindings: FindingDraft[];

beforeAll(() => {
  const { db, sqlite } = createTestDb();
  const orgId = randomUUID();
  db.insert(schema.organizations)
    .values({ id: orgId, name: "Northbound Supply Co.", createdAt: new Date() })
    .run();

  const providers = [
    { key: "shopify", provider: shopifyMockProvider },
    { key: "meta", provider: metaMockProvider },
    { key: "google-ads", provider: googleAdsMockProvider },
    { key: "klaviyo", provider: klaviyoMockProvider },
    { key: "gorgias", provider: gorgiasMockProvider },
    { key: "inventory", provider: inventoryMockProvider },
  ];
  const entries = providers.map(({ key, provider }) => {
    const connectionId = randomUUID();
    db.insert(schema.dataConnections)
      .values({
        id: connectionId,
        orgId,
        providerKey: key,
        displayName: key,
        isSimulated: true,
        status: "connected",
      })
      .run();
    return { connectionId, provider };
  });
  const dates = Array.from({ length: 30 }, (_, index) => dateForDayIndex(index));

  ingestProvidersForDates(db, orgId, entries, dates);
  groups = groupMetricsIntoSeries(db.select().from(schema.metrics).all());
  ruleFindings = evaluateRules(PRODUCTION_RULES, groups, ASOF);
  crossDomainFindings = evaluateCrossDomainRules(groups, ASOF);
  sqlite.close();
});

describe("condition 1: revenue down while traffic is flat", () => {
  it("finds exactly one organization-level conversion issue", () => {
    const findings = crossDomainFindings.filter(
      (finding) =>
        finding.ruleId === "conversion-issue" &&
        finding.domain === "commerce" &&
        finding.entityType === "org" &&
        finding.entityId === "org",
    );

    expect(findings).toHaveLength(1);
  });
});

describe("condition 2: Meta CPA drifts upward", () => {
  it("finds CPA drift for the retargeting campaign", () => {
    expect(
      ruleFindings.some(
        (finding) =>
          finding.ruleId === "cpa-drift" &&
          finding.entityId === "meta-retargeting-core",
      ),
    ).toBe(true);
  });
});

describe("condition 3: one Meta campaign collapses", () => {
  it("flags the bestseller campaign on at least one collapse day", () => {
    expect(
      groups.some(
        (group) =>
          group.entityId === "meta-prospecting-bestseller" &&
          group.metricKey === "cpa",
      ),
    ).toBe(true);

    const anyDateFlagged = Array.from({ length: 9 }, (_, offset) =>
      detectAnomalies(groups, dateForDayIndex(21 + offset)).some(
        (finding) => finding.entityId === "meta-prospecting-bestseller",
      ),
    ).some(Boolean);

    expect(anyDateFlagged).toBe(true);
  });
});

describe("condition 4: Trailhead pack stockout risk", () => {
  it("finds a critical stockout risk", () => {
    expect(
      ruleFindings.some(
        (finding) =>
          finding.ruleId === "stockout-risk" &&
          finding.entityId === "trailhead-35l-pack" &&
          finding.severity === "critical",
      ),
    ).toBe(true);
  });
});

describe("condition 5: Glacier bottle refunds rise", () => {
  it("finds either the SKU refund rule or isolation finding", () => {
    const found =
      ruleFindings.some(
        (finding) =>
          finding.ruleId === "refund-rate-spike" &&
          finding.entityId === "glacier-bottle-24oz",
      ) ||
      crossDomainFindings.some(
        (finding) =>
          finding.ruleId === "refund-sku-isolation" &&
          finding.entityId === "glacier-bottle-24oz",
      );

    expect(found).toBe(true);
  });
});

describe("condition 6: shipping complaints spike", () => {
  it("finds either the shipping ticket rule or inventory correlation", () => {
    const found =
      ruleFindings.some(
        (finding) =>
          finding.ruleId === "shipping-tickets-spike" &&
          finding.entityId === "shipping_delay",
      ) ||
      crossDomainFindings.some(
        (finding) =>
          finding.ruleId === "tickets-shipping-inventory" &&
          finding.entityId === "shipping_delay",
      );

    expect(found).toBe(true);
  });
});

describe("condition 7: Klaviyo flows are strong", () => {
  it("finds revenue growth for both flows", () => {
    expect(
      ruleFindings.some(
        (finding) =>
          finding.ruleId === "flow-revenue-growth" &&
          finding.entityId === "abandoned_cart",
      ),
    ).toBe(true);
    expect(
      ruleFindings.some(
        (finding) =>
          finding.ruleId === "flow-revenue-growth" &&
          finding.entityId === "welcome_series",
      ),
    ).toBe(true);
  });
});

describe("condition 8: returning-customer revenue remains resilient", () => {
  it("shows new-customer revenue absorbs the decline", () => {
    const returningGroup = groups.find(
      (group) =>
        group.metricKey === "returning_customer_revenue" &&
        group.entityType === "org",
    );
    const newGroup = groups.find(
      (group) =>
        group.metricKey === "new_customer_revenue" && group.entityType === "org",
    );

    expect(returningGroup).toBeDefined();
    expect(newGroup).toBeDefined();

    if (returningGroup === undefined || newGroup === undefined) {
      throw new Error("Expected organization revenue groups to be present");
    }

    const returningTrend = windowTrend(
      returningGroup.points.map((point) => ({ date: point.date, value: point.value })),
      7,
    );
    const newTrend = windowTrend(
      newGroup.points.map((point) => ({ date: point.date, value: point.value })),
      7,
    );

    if (returningTrend.percentChange === null || newTrend.percentChange === null) {
      throw new Error("Expected comparable revenue trends");
    }

    expect(returningTrend.percentChange).toBeGreaterThanOrEqual(-0.05);
    expect(newTrend.percentChange).toBeLessThanOrEqual(-0.1);
  });
});

describe("condition 9: Ridgeline campaign is an opportunity", () => {
  it("finds the underinvested high-ROAS campaign", () => {
    expect(
      ruleFindings.some(
        (finding) =>
          finding.ruleId === "underinvested-high-roas-campaign" &&
          finding.entityId === "meta-prospecting-ridgeline" &&
          finding.severity === "opportunity",
      ),
    ).toBe(true);
  });
});

describe("pipeline grouping sanity", () => {
  it("creates populated series with at most one point per scenario day", () => {
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((group) => group.points.length >= 1 && group.points.length <= 30)).toBe(true);
  });
});
