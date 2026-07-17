import Link from "next/link";

import { BarChart } from "@/components/BarChart";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { EvidenceDisclosure } from "@/components/EvidenceDisclosure";
import { SeverityBadge } from "@/components/SeverityBadge";
import db from "@/lib/db/client";
import { formatDate } from "@/lib/web/format";
import { getDemoOrg, listBriefs } from "@/lib/web/queries";

const STATUS_SCORE: Record<string, number> = { strong: 4, stable: 3, mixed: 2, at_risk: 1 };

export default function Page() {
  const org = getDemoOrg(db);
  const briefsRows = listBriefs(db, org.id);
  if (briefsRows.length === 0) return <EmptyState title="No briefs yet" description="Run npm run db:seed or generate today's brief." />;
  const trendBars = [...briefsRows].reverse().map((b) => ({ label: formatDate(b.date), value: STATUS_SCORE[b.overallStatus] ?? 0 }));

  return <div className="flex flex-col gap-6">
    <Card title="Status Trend"><div className="overflow-x-auto text-accent"><BarChart bars={trendBars} width={Math.max(400, trendBars.length * 24)} height={80} /></div></Card>
    <div className="flex flex-col gap-2">
      {briefsRows.map((brief) => <EvidenceDisclosure key={brief.id} summary={<span className="flex items-center gap-2"><span className="font-medium">{formatDate(brief.date)}</span><SeverityBadge kind="status" value={brief.overallStatus} /><span className="text-muted truncate">{brief.executiveSummary}</span><Link href={`/brief/${brief.id}/print`} className="text-accent hover:opacity-90">Print</Link></span>}>
        <p className="text-sm">{brief.executiveSummary}</p>
        {brief.wins.length > 0 ? <ul className="mt-2 list-disc pl-4 text-sm">{brief.wins.map((win, i) => <li key={i}>{win}</li>)}</ul> : null}
      </EvidenceDisclosure>)}
    </div>
  </div>;
}
