import { and, desc, eq, inArray } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

export const TODAY = "2026-07-16";
type Database = BetterSQLite3Database<typeof schema>;

export function getDemoOrg(db: Database): schema.OrganizationRow {
  const org = db.select().from(schema.organizations).limit(1).all()[0];
  if (!org) throw new Error("No seeded organization found — run `npm run db:seed`.");
  return org;
}
export function getLatestBrief(db: Database, orgId: string): schema.BriefRow | undefined { return db.select().from(schema.briefs).where(eq(schema.briefs.orgId, orgId)).orderBy(desc(schema.briefs.date)).limit(1).get(); }
export function getBriefByDate(db: Database, orgId: string, date: string): schema.BriefRow | undefined { return db.select().from(schema.briefs).where(and(eq(schema.briefs.orgId, orgId), eq(schema.briefs.date, date))).get(); }
export function listBriefs(db: Database, orgId: string): schema.BriefRow[] { return db.select().from(schema.briefs).where(eq(schema.briefs.orgId, orgId)).orderBy(desc(schema.briefs.date)).all(); }
export function getFindingsForDate(db: Database, orgId: string, date: string): schema.FindingRow[] { return db.select().from(schema.findings).where(and(eq(schema.findings.orgId, orgId), eq(schema.findings.date, date))).orderBy(desc(schema.findings.score)).all(); }
export function getFindingsByIds(db: Database, ids: string[]): schema.FindingRow[] { if (!ids.length) return []; return db.select().from(schema.findings).where(inArray(schema.findings.id, ids)).all(); }
export function getMetricsByIds(db: Database, ids: string[]): schema.MetricRow[] { if (!ids.length) return []; return db.select().from(schema.metrics).where(inArray(schema.metrics.id, ids)).all(); }
export function getAllMetrics(db: Database, orgId: string): schema.MetricRow[] { return db.select().from(schema.metrics).where(eq(schema.metrics.orgId, orgId)).all(); }
export function getTargets(db: Database, orgId: string): schema.TargetRow[] { return db.select().from(schema.targets).where(eq(schema.targets.orgId, orgId)).all(); }
export function listDataConnections(db: Database, orgId: string): schema.DataConnectionRow[] { return db.select().from(schema.dataConnections).where(eq(schema.dataConnections.orgId, orgId)).all(); }
export function getLatestSyncRun(db: Database, connectionId: string): schema.SyncRunRow | undefined { return db.select().from(schema.syncRuns).where(eq(schema.syncRuns.connectionId, connectionId)).orderBy(desc(schema.syncRuns.finishedAt)).limit(1).get(); }
