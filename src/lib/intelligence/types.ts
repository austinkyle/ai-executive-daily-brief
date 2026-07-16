export interface MetricPoint {
  id: string;
  date: string;
  value: number;
}

export interface MetricSeriesGroup {
  domain: string;
  metricKey: string;
  entityType: string;
  entityId: string;
  unit: string;
  points: MetricPoint[];
}

export type Severity = "critical" | "warning" | "opportunity" | "info";

export interface FindingDraft {
  ruleId: string;
  domain: string;
  entityType: string;
  entityId: string;
  severity: Severity;
  title: string;
  whatChanged: string;
  whyItMatters: string;
  recommendedNextStep: string;
  confidence: number;
  magnitude: number;
  evidenceMetricIds: string[];
  date: string;
}
