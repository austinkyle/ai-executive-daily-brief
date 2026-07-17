import { notFound } from "next/navigation";

import { Card } from "@/components/Card";
import { EvidenceDisclosure } from "@/components/EvidenceDisclosure";
import { KeyNumberTile } from "@/components/KeyNumberTile";
import { PrintButton } from "@/components/PrintButton";
import { StatusBanner } from "@/components/StatusBanner";
import db from "@/lib/db/client";
import { formatPercent, guessUnitForMetricKey, humanizeMetricKey } from "@/lib/web/format";
import { getBriefById, getDeliveriesForBrief, getFindingsByIds } from "@/lib/web/queries";

export default async function PrintBriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brief = getBriefById(db, id);
  if (!brief) notFound();
  const evidenceFindings = brief.evidenceFindingRefs.length ? getFindingsByIds(db, brief.evidenceFindingRefs) : [];
  const deliveries = getDeliveriesForBrief(db, id);
  const list = (items: string[]) => <ul className="list-disc pl-4 text-sm flex flex-col gap-1">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
  return <div className="flex flex-col gap-6">
    <PrintButton />
    <StatusBanner status={brief.overallStatus as "strong" | "stable" | "mixed" | "at_risk"} summary={brief.executiveSummary} />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{brief.wins.length ? <Card title="Wins">{list(brief.wins)}</Card> : null}{brief.risks.length ? <Card title="Risks">{list(brief.risks)}</Card> : null}{brief.opportunities.length ? <Card title="Opportunities">{list(brief.opportunities)}</Card> : null}</div>
    {brief.recommendedActions.length ? <Card title="Recommended Actions">{list(brief.recommendedActions)}</Card> : null}
    {Object.keys(brief.keyNumbers).length ? <Card title="Key Numbers"><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Object.entries(brief.keyNumbers).map(([key, value]) => <KeyNumberTile key={key} label={humanizeMetricKey(key)} value={value} unit={guessUnitForMetricKey(key)} />)}</div></Card> : null}
    {brief.evidenceFindingRefs.length ? <EvidenceDisclosure summary={`Evidence (${evidenceFindings.length} findings)`}><ul className="flex flex-col gap-3">{evidenceFindings.map((finding) => <li key={finding.id}><p className="font-medium">{finding.title}</p><p>{finding.whatChanged}</p><p className="text-muted">{finding.whyItMatters}</p><p className="text-xs text-muted">Confidence: {formatPercent(finding.confidence)}</p></li>)}</ul></EvidenceDisclosure> : null}
    <Card title="Delivery Log"><ul className="flex flex-col gap-1 text-sm">{deliveries.map((delivery) => <li key={delivery.id}>{delivery.channel} -- {delivery.status} at {delivery.sentAt.toLocaleString()}</li>)}</ul></Card>
  </div>;
}
