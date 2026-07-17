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
  it("suppresses statistically unusual but trivially small moves", () => {
    // Very stable baseline: z-score is large but the move is < 5% relative change.
    const series = points([10, 10.01, 9.99, 10, 10.01, 9.99, 10, 10.3]);
    const score = computeZScore(series, targetDate);
    expect(score).not.toBeNull();
    expect(Math.abs(score!.zScore)).toBeGreaterThan(2);
    expect(detectAnomalies([group(series)], targetDate)).toEqual([]);
  });
  it("grades severity by both rarity and business magnitude", () => {
    const large = detectAnomalies([group(points([9.9, 10.1, 10, 9.8, 10.2, 10, 9.9, 50]))], targetDate);
    expect(large).toHaveLength(1);
    expect(large[0]!.severity).toBe("critical");
    // ~8% move: clears the floor but not the critical relative-change bar.
    const modest = detectAnomalies([group(points([10, 10.05, 9.95, 10, 10.05, 9.95, 10, 10.8]))], targetDate);
    expect(modest).toHaveLength(1);
    expect(modest[0]!.severity).toBe("warning");
  });
  it("returns null with fewer than two baseline points", () => {
    expect(computeZScore(points([10, 50]), targetDate)).toBeNull();
  });
  it("returns null for a perfectly flat baseline", () => {
    expect(computeZScore(points([10, 10, 10, 50]), targetDate)).toBeNull();
  });
});
