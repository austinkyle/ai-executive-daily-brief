import { ConnectionCard } from "@/components/ConnectionCard";
import db from "@/lib/db/client";
import { getDemoOrg, getLatestSyncRun, listDataConnections } from "@/lib/web/queries";

export default function Page() {
  const org = getDemoOrg(db);
  const connections = listDataConnections(db, org.id);
  if (connections.length === 0) return <p className="text-muted text-sm">No data connections configured.</p>;
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{connections.map((conn) => {
    const lastRun = getLatestSyncRun(db, conn.id);
    const lastSyncedLabel = lastRun?.finishedAt ? `${lastRun.finishedAt.toISOString().slice(0, 16).replace("T", " ")} UTC` : "Never";
    return <ConnectionCard key={conn.id} displayName={conn.displayName} providerKey={conn.providerKey} status={conn.status} isSimulated={conn.isSimulated} lastSyncedLabel={lastSyncedLabel} />;
  })}</div>;
}
