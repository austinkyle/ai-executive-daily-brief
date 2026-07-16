import { describe, expect, it } from "vitest";

import { dateForDayIndex, generateScenario } from "./scenario-generator";

describe("generateScenario", () => {
  it("produces identical metrics on every call", () => {
    expect(JSON.stringify(generateScenario())).toBe(JSON.stringify(generateScenario()));
  });

  it("generates every metric for all 30 days", () => {
    const commerceOrgMetrics = 7;
    const commerceSkuMetrics = 3 + 3 + 3;
    const inventoryMetrics = 2;
    const marketingMetrics = 3 * 5 + 1 * 5;
    const emailMetrics = 2 * 3;
    const supportMetrics = 3;
    const expectedCount = 30 * (commerceOrgMetrics + commerceSkuMetrics + inventoryMetrics + marketingMetrics + emailMetrics + supportMetrics);

    expect(generateScenario()).toHaveLength(expectedCount);
  });

  it("lands the commerce conversion step-down near 2.05%", () => {
    const metric = generateScenario().find(
      (candidate) => candidate.date === dateForDayIndex(29) && candidate.domain === "commerce" && candidate.metricKey === "conversion_rate" && candidate.entityId === "org",
    );

    expect(metric?.value).toBeGreaterThan(0.019);
    expect(metric?.value).toBeLessThan(0.022);
  });

  it("produces the Meta bestseller CPA collapse", () => {
    const metric = generateScenario().find(
      (candidate) => candidate.date === dateForDayIndex(29) && candidate.domain === "marketing" && candidate.metricKey === "cpa" && candidate.entityId === "meta-prospecting-bestseller",
    );

    expect(metric?.value).toBeGreaterThan(80);
  });

  it("reduces trailhead inventory to fewer than 10 days", () => {
    const metric = generateScenario().find(
      (candidate) => candidate.date === dateForDayIndex(29) && candidate.domain === "inventory" && candidate.metricKey === "days_of_inventory" && candidate.entityId === "trailhead-35l-pack",
    );

    expect(metric?.value).toBeLessThan(10);
  });

  it("maps scenario endpoints to their calendar dates", () => {
    expect(dateForDayIndex(0)).toBe("2026-06-17");
    expect(dateForDayIndex(29)).toBe("2026-07-16");
  });
});
