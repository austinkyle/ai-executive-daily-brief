import { describe, expect, it } from "vitest";

import { evaluateRules, PRODUCTION_RULES, type ThresholdRule } from "./rules";
import type { MetricSeriesGroup } from "./types";

const asOfDate = "2026-07-16";
const group = (values: number[], dates?: string[]): MetricSeriesGroup => ({
  domain: "test", metricKey: "metric", entityType: "entity", entityId: "entity-1", unit: "count",
  points: values.map((value, index) => ({ id: `p-${index}`, date: dates?.[index] ?? `2026-07-${String(10 + index).padStart(2, "0")}`, value })),
});
const rule = (comparisonType: ThresholdRule["comparisonType"]): ThresholdRule => ({
  id: "test-rule", domain: "test", metricKey: "metric", entityType: "entity", comparisonType,
  windowDays: comparisonType === "windowTrend" ? 2 : undefined, operator: "gt", threshold: comparisonType === "latestValue" ? 10 : 0.2,
  severity: "info", confidence: 1, title: () => "title", whatChanged: () => "changed", whyItMatters: () => "matters", recommendedNextStep: () => "next",
});

describe("evaluateRules", () => {
  it("evaluates latest-value thresholds", () => {
    const testRule = rule("latestValue");
    expect(evaluateRules([testRule], [group([12], [asOfDate])], asOfDate)).toHaveLength(1);
    expect(evaluateRules([testRule], [group([10], [asOfDate])], asOfDate)).toHaveLength(0);
  });
  it("evaluates day-over-day thresholds", () => {
    const testRule = rule("dayOverDay");
    expect(evaluateRules([testRule], [group([10, 13], ["2026-07-15", asOfDate])], asOfDate)).toHaveLength(1);
    expect(evaluateRules([testRule], [group([10, 12], ["2026-07-15", asOfDate])], asOfDate)).toHaveLength(0);
  });
  it("evaluates same-weekday week-over-week thresholds", () => {
    const testRule = rule("sameWeekdayWoW");
    expect(evaluateRules([testRule], [group([10, 13], ["2026-07-09", asOfDate])], asOfDate)).toHaveLength(1);
    expect(evaluateRules([testRule], [group([10, 12], ["2026-07-09", asOfDate])], asOfDate)).toHaveLength(0);
  });
  it("evaluates window-trend thresholds", () => {
    const testRule = rule("windowTrend");
    expect(evaluateRules([testRule], [group([10, 10, 13, 13])], asOfDate)).toHaveLength(1);
    expect(evaluateRules([testRule], [group([10, 10, 12, 12])], asOfDate)).toHaveLength(0);
  });
  it("skips groups with missing comparison data", () => {
    expect(evaluateRules([rule("dayOverDay")], [group([10], [asOfDate])], asOfDate)).toEqual([]);
  });
  it("exports the six production rules", () => {
    expect(PRODUCTION_RULES.map((productionRule) => productionRule.id)).toEqual(["cpa-drift", "stockout-risk", "refund-rate-spike", "shipping-tickets-spike", "flow-revenue-growth", "underinvested-high-roas-campaign"]);
  });
});
