import type { MetricSeriesGroup } from "./types";

export function groupMetricsIntoSeries(rows: { id: string; date: string; domain: string; metricKey: string; entityType: string; entityId: string; value: number; unit: string }[]): MetricSeriesGroup[] {
  const groups = new Map<string, MetricSeriesGroup>();
  for (const row of rows) {
    const key = `${row.domain}::${row.metricKey}::${row.entityType}::${row.entityId}`;
    let group = groups.get(key);
    if (!group) {
      group = { domain: row.domain, metricKey: row.metricKey, entityType: row.entityType, entityId: row.entityId, unit: row.unit, points: [] };
      groups.set(key, group);
    }
    group.points.push({ id: row.id, date: row.date, value: row.value });
  }
  return [...groups.values()];
}
