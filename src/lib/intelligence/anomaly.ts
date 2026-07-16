import type { FindingDraft, MetricPoint, MetricSeriesGroup } from "./types";

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
    findings.push({
      ruleId: "anomaly-zscore", domain: group.domain, entityType: group.entityType, entityId: group.entityId, severity: "critical",
      title: `Unusual movement in ${group.metricKey} for ${group.entityId}`,
      whatChanged: `${group.metricKey} for ${group.entityId} is ${result.value.toFixed(2)} vs a recent baseline average of ${result.mean.toFixed(2)} (z-score ${result.zScore.toFixed(2)}).`,
      whyItMatters: "This is a statistically unusual deviation from recent normal behavior and likely reflects an isolated, entity-specific issue rather than a broad market shift.",
      recommendedNextStep: `Investigate ${group.entityId} directly to confirm the cause of this deviation.`,
      confidence: Math.min(Math.abs(result.zScore) / 4, 1), magnitude: Math.abs(result.zScore), evidenceMetricIds: [result.targetId, ...result.baselineIds], date: asOfDate,
    });
  }
  return findings;
}
