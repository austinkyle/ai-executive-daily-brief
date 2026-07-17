import { metricPhrase } from "./labels";
import type { FindingDraft, MetricPoint, MetricSeriesGroup } from "./types";

// A statistically unusual reading (high |z|) can still be a trivially small business
// move when the baseline is very stable, so anomalies must also clear a relative-change
// floor, and severity/magnitude blend statistical rarity with business impact.
const RELATIVE_CHANGE_FLOOR = 0.05;
const CRITICAL_Z = 3;
const CRITICAL_RELATIVE_CHANGE = 0.15;

export function computeZScore(points: MetricPoint[], targetDate: string, windowDays = 7): { value: number; mean: number; stdDev: number; zScore: number; baselineIds: string[]; targetId: string } | null {
  const sorted = [...points].sort((left, right) => left.date.localeCompare(right.date));
  const target = sorted.find((point) => point.date === targetDate);
  if (target === undefined) return null;

  const baseline = sorted.filter((point) => point.date < targetDate).slice(-windowDays);
  if (baseline.length < 2) return null;
  const mean = baseline.reduce((sum, point) => sum + point.value, 0) / baseline.length;
  const stdDev = Math.sqrt(baseline.reduce((sum, point) => sum + (point.value - mean) ** 2, 0) / (baseline.length - 1));
  if (stdDev === 0) return null;

  return { value: target.value, mean, stdDev, zScore: (target.value - mean) / stdDev, baselineIds: baseline.map((point) => point.id), targetId: target.id };
}

export function detectAnomalies(groups: MetricSeriesGroup[], asOfDate: string, options?: { windowDays?: number; zThreshold?: number }): FindingDraft[] {
  const windowDays = options?.windowDays ?? 7;
  const zThreshold = options?.zThreshold ?? 2;
  const findings: FindingDraft[] = [];

  for (const group of groups) {
    const result = computeZScore(group.points, asOfDate, windowDays);
    if (result === null || Math.abs(result.zScore) <= zThreshold) continue;
    const relativeChange = Math.abs(result.mean) < 1e-9 ? Number.POSITIVE_INFINITY : Math.abs(result.value - result.mean) / Math.abs(result.mean);
    if (relativeChange < RELATIVE_CHANGE_FLOOR) continue;
    const severity = Math.abs(result.zScore) > CRITICAL_Z && relativeChange >= CRITICAL_RELATIVE_CHANGE ? "critical" : "warning";
    const phrase = metricPhrase(group.metricKey, group.entityId);
    const direction = result.value >= result.mean ? "up" : "down";
    findings.push({
      ruleId: "anomaly-zscore", domain: group.domain, entityType: group.entityType, entityId: group.entityId, severity,
      title: `Unusual movement in ${phrase}`,
      whatChanged: `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)} is ${result.value.toFixed(2)} vs a recent baseline average of ${result.mean.toFixed(2)} — ${direction} ${(relativeChange * 100).toFixed(1)}% (z-score ${result.zScore.toFixed(2)}).`,
      whyItMatters: "This is a statistically unusual deviation from recent normal behavior and likely reflects an isolated, entity-specific issue rather than a broad market shift.",
      recommendedNextStep: `Investigate ${phrase} directly to confirm the cause of this deviation.`,
      confidence: Math.min(Math.abs(result.zScore) / 4, 1),
      magnitude: Math.min(Math.abs(result.zScore), 4) * Math.min(relativeChange, 1) * 2.5,
      evidenceMetricIds: [result.targetId, ...result.baselineIds], date: asOfDate,
    });
  }
  return findings;
}
