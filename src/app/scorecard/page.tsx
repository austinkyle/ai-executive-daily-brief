import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Sparkline } from "@/components/Sparkline";
import { dayOverDay, sameWeekdayWoW, targetVariance, trailing7Avg } from "@/lib/analytics/compare";
import db from "@/lib/db/client";
import { groupMetricsIntoSeries } from "@/lib/intelligence/group-metrics";
import { DOMAIN_LABELS, formatCurrency, formatDelta, formatNumber, formatPercent, guessUnitForMetricKey, humanizeMetricKey } from "@/lib/web/format";
import { getAllMetrics, getDemoOrg, getTargets, TODAY } from "@/lib/web/queries";

export default function Page() {
  const org = getDemoOrg(db);
  const metricRows = getAllMetrics(db, org.id);
  const targetRows = getTargets(db, org.id);
  const groups = groupMetricsIntoSeries(metricRows);
  const month = "2026-07";
  const monthTargets = targetRows.filter((target) => target.month === month);

  if (!groups.length) return <EmptyState title="No metrics yet" description="Run npm run db:seed to populate demo data." />;

  const formatAverage = (value: number | null, metricKey: string) => {
    if (value === null) return "—";
    const unit = guessUnitForMetricKey(metricKey);
    return unit === "currency" ? formatCurrency(value) : unit === "percent" ? formatPercent(value) : formatNumber(value);
  };
  const domains = [...new Set(groups.map((group) => group.domain))].sort();

  return <div className="flex flex-col gap-8">
    {monthTargets.length ? <Card title="Monthly Targets (MTD)"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {["gross_sales", "spend"].map((metricKey) => {
        const target = monthTargets.find((row) => row.metricKey === metricKey);
        if (!target) return null;
        const actual = groups.filter((group) => group.metricKey === metricKey).flatMap((group) => group.points).filter((point) => point.date.startsWith(month)).reduce((sum, point) => sum + point.value, 0);
        const variance = targetVariance(actual, target.targetValue);
        const favorable = metricKey === "spend" ? variance.absoluteVariance <= 0 : variance.absoluteVariance >= 0;
        return <div key={metricKey} className="flex flex-col gap-1"><span className="text-sm text-muted">{humanizeMetricKey(metricKey)}</span><span className="tabular-nums">{formatCurrency(actual)} actual vs {formatCurrency(target.targetValue)} target</span><span className={`text-sm tabular-nums ${favorable ? "text-green" : "text-red"}`}>{formatDelta(variance.absoluteVariance, "currency")}</span></div>;
      })}
    </div></Card> : null}
    {domains.map((domain) => <section key={domain}>
      <h2 className="text-lg font-semibold mb-3">{DOMAIN_LABELS[domain] ?? domain}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.filter((group) => group.domain === domain).map((group) => {
          const unit = guessUnitForMetricKey(group.metricKey);
          const stats = [
            ["DoD", formatDelta(dayOverDay(group.points, TODAY).absoluteChange, unit)],
            ["WoW", formatDelta(sameWeekdayWoW(group.points, TODAY).absoluteChange, unit)],
            ["7-day avg", formatAverage(trailing7Avg(group.points, TODAY).average, group.metricKey)],
          ];
          const title = group.entityType === "org" ? humanizeMetricKey(group.metricKey) : `${humanizeMetricKey(group.metricKey)} — ${group.entityId}`;
          return <Card key={`${group.domain}-${group.metricKey}-${group.entityType}-${group.entityId}`} title={title}><div className="flex flex-col gap-2"><Sparkline points={group.points} />{stats.map(([label, value]) => <div key={label} className="flex justify-between text-xs"><span className="text-muted">{label}</span><span className="tabular-nums">{value}</span></div>)}</div></Card>;
        })}
      </div>
    </section>)}
  </div>;
}
