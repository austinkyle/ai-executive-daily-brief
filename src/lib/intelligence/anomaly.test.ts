import { describe, expect, it } from "vitest";

import { computeZScore, detectAnomalies } from "./anomaly";
import type { MetricPoint, MetricSeriesGroup } from "./types";

const targetDate = "2026-07-16";
const points = (values: number[]): MetricPoint[] => values.map((value, index) => ({ id: `point-${index}`, date: `2026-07-${String(9 + index).padStart(2, "0")}`, value }));
const group = (series: MetricPoint[]): MetricSeriesGroup => ({ domain: "test", metricKey: "metric", entityType: "entity", entityId: "entity-1", unit: "count", points: series });

describe("anomaly scoring", () => {
  it("scores an outlier and detects it as an anomaly", () => {
    const series = points([9.9, 10.1, 10, 9.8, 10.2, 10, 9.9, 50]);
    const score = computeZScore(series, targetDate);
    expect(score).not.toBeNull();
    expect(score!.zScore).toBeGreaterThan(2);
    expect(detectAnomalies([group(series)], targetDate)).toHaveLength(1);
  });
  it("does not detect target values within normal noise", () => {
    const series = points([9.5, 10.2, 10, 9.8, 10.3, 9.9, 10.1, 10.4]);
    expect(detectAnomalies([group(series)], targetDate)).toEqual([]);
  });
  it("returns null with fewer than two baseline points", () => {
    expect(computeZScore(points([10, 50]), targetDate)).toBeNull();
  });
  it("returns null for a perfectly flat baseline", () => {
    expect(computeZScore(points([10, 10, 10, 50]), targetDate)).toBeNull();
  });
});
