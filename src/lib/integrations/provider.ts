export interface NormalizedMetric {
  domain: string;
  metricKey: string;
  entityType: string;
  entityId: string;
  value: number;
  unit: string;
  date: string;
}

export interface DataProvider {
  providerKey: string;
  fetchDailyMetrics(date: string): NormalizedMetric[];
}
