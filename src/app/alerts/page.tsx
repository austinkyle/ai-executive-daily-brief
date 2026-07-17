import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { EvidenceDisclosure } from "@/components/EvidenceDisclosure";
import { SeverityBadge } from "@/components/SeverityBadge";
import db from "@/lib/db/client";
import { DOMAIN_LABELS, formatPercent } from "@/lib/web/format";
import { getDemoOrg, getFindingsForDate, getMetricsByIds, TODAY } from "@/lib/web/queries";

const SEVERITY_ORDER = ["critical", "warning", "opportunity", "info"] as const;

export default function Page() {
  const org = getDemoOrg(db);
  const findings = getFindingsForDate(db, org.id, TODAY);
  if (findings.length === 0) return <EmptyState title="No alerts today" description="No findings were generated for today's data." />;

  const groups = SEVERITY_ORDER.map((severity) => ({ severity, items: findings.filter((finding) => finding.severity === severity) })).filter((group) => group.items.length > 0);

  return <div className="flex flex-col gap-8">
    {groups.map(({ severity, items }) => <section key={severity}>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <SeverityBadge kind="severity" value={severity} />
        <span className="text-muted text-sm font-normal">({items.length})</span>
      </h2>
      <div className="flex flex-col gap-4">
        {items.map((finding) => {
          const evidenceMetrics = finding.evidenceMetricRefs.length ? getMetricsByIds(db, finding.evidenceMetricRefs) : [];
          return <Card key={finding.id} title={finding.title}>
            <p className="text-sm">{finding.whatChanged}</p>
            <p className="mt-2 text-sm text-muted">{finding.whyItMatters}</p>
            <p className="mt-2 text-xs text-muted">Confidence: {formatPercent(finding.confidence)}</p>
            <p className="mt-2 text-sm font-medium">Next step: {finding.recommendedNextStep}</p>
            <div className="mt-3">
              {finding.evidenceMetricRefs.length > 0 ? <EvidenceDisclosure summary={`Evidence (${evidenceMetrics.length} metrics)`}>
                <ul className="flex flex-col gap-1 text-xs">
                  {evidenceMetrics.map((metric) => <li key={metric.id}>{DOMAIN_LABELS[metric.domain] ?? metric.domain} · {metric.metricKey} ({metric.entityId}): {metric.value} {metric.unit}</li>)}
                </ul>
              </EvidenceDisclosure> : null}
            </div>
          </Card>;
        })}
      </div>
    </section>)}
  </div>;
}
