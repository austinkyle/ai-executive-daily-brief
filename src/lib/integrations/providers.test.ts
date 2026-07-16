import { describe, expect, it } from "vitest";

import { gorgiasMockProvider } from "./gorgias-mock";
import { googleAdsMockProvider } from "./google-ads-mock";
import { inventoryMockProvider } from "./inventory-mock";
import { klaviyoMockProvider } from "./klaviyo-mock";
import { metaMockProvider } from "./meta-mock";
import { generateScenario } from "./scenario-generator";
import { shopifyMockProvider } from "./shopify-mock";

const date = "2026-06-20";

describe("mock data providers", () => {
  it("returns Shopify commerce metrics for the requested date", () => {
    const metrics = shopifyMockProvider.fetchDailyMetrics(date);

    expect(metrics).not.toHaveLength(0);
    expect(
      metrics.every(
        (metric) => metric.date === date && metric.domain === "commerce",
      ),
    ).toBe(true);
  });

  it("returns Meta campaign metrics for the requested date", () => {
    const metrics = metaMockProvider.fetchDailyMetrics(date);

    expect(metrics).not.toHaveLength(0);
    expect(
      metrics.every(
        (metric) =>
          metric.date === date &&
          metric.domain === "marketing" &&
          metric.entityId.startsWith("meta-"),
      ),
    ).toBe(true);
  });

  it("returns Google Ads campaign metrics for the requested date", () => {
    const metrics = googleAdsMockProvider.fetchDailyMetrics(date);

    expect(metrics).not.toHaveLength(0);
    expect(
      metrics.every(
        (metric) =>
          metric.date === date &&
          metric.domain === "marketing" &&
          metric.entityId === "google-branded-search",
      ),
    ).toBe(true);
  });

  it("returns Klaviyo email metrics for the requested date", () => {
    const metrics = klaviyoMockProvider.fetchDailyMetrics(date);

    expect(metrics).not.toHaveLength(0);
    expect(
      metrics.every((metric) => metric.date === date && metric.domain === "email"),
    ).toBe(true);
  });

  it("returns Gorgias support metrics for the requested date", () => {
    const metrics = gorgiasMockProvider.fetchDailyMetrics(date);

    expect(metrics).not.toHaveLength(0);
    expect(
      metrics.every(
        (metric) => metric.date === date && metric.domain === "support",
      ),
    ).toBe(true);
  });

  it("returns inventory metrics for the requested date", () => {
    const metrics = inventoryMockProvider.fetchDailyMetrics(date);

    expect(metrics).not.toHaveLength(0);
    expect(
      metrics.every(
        (metric) => metric.date === date && metric.domain === "inventory",
      ),
    ).toBe(true);
  });

  it("partitions all scenario metrics without duplicate provider rows", () => {
    const providerMetrics = [
      shopifyMockProvider,
      metaMockProvider,
      googleAdsMockProvider,
      klaviyoMockProvider,
      gorgiasMockProvider,
      inventoryMockProvider,
    ].map((provider) => provider.fetchDailyMetrics(date));
    const combined = providerMetrics.flat();
    const expected = generateScenario().filter((metric) => metric.date === date);
    const providerKeys = providerMetrics.map((metrics) =>
      new Set(
        metrics.map((metric) =>
          [metric.metricKey, metric.entityType, metric.entityId].join(":"),
        ),
      ),
    );
    const duplicateProviderKeys = providerKeys.flatMap((keys, index) =>
      [...keys].filter((key) =>
        providerKeys.some(
          (otherKeys, otherIndex) =>
            otherIndex !== index && otherKeys.has(key),
        ),
      ),
    );

    expect(combined).toHaveLength(expected.length);
    expect(duplicateProviderKeys).toHaveLength(0);
  });

  it("returns no Shopify metrics outside the scenario window", () => {
    expect(shopifyMockProvider.fetchDailyMetrics("2026-08-01")).toEqual([]);
  });
});
