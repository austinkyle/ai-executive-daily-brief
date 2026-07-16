import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const memberships = sqliteTable("memberships", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
});

export const dataConnections = sqliteTable("data_connections", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id),
  providerKey: text("provider_key").notNull(),
  displayName: text("display_name").notNull(),
  isSimulated: integer("is_simulated", { mode: "boolean" }).notNull(),
  status: text("status").notNull(),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  credentialsRef: text("credentials_ref"),
});

export const syncRuns = sqliteTable("sync_runs", {
  id: text("id").primaryKey(),
  connectionId: text("connection_id").notNull().references(() => dataConnections.id),
  orgId: text("org_id").notNull().references(() => organizations.id),
  runDate: text("run_date").notNull(),
  status: text("status").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  error: text("error"),
});

export const metrics = sqliteTable("metrics", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id),
  date: text("date").notNull(),
  domain: text("domain").notNull(),
  metricKey: text("metric_key").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
});

export const targets = sqliteTable("targets", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id),
  metricKey: text("metric_key").notNull(),
  month: text("month").notNull(),
  targetValue: real("target_value").notNull(),
});

export const findings = sqliteTable("findings", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id),
  date: text("date").notNull(),
  domain: text("domain").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  whatChanged: text("what_changed").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  confidence: real("confidence").notNull(),
  score: real("score").notNull(),
  evidenceMetricRefs: text("evidence_metric_refs", { mode: "json" }).$type<string[]>().notNull(),
  recommendedNextStep: text("recommended_next_step").notNull(),
});

export const briefs = sqliteTable("briefs", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id),
  date: text("date").notNull(),
  status: text("status").notNull(),
  overallStatus: text("overall_status").notNull(),
  executiveSummary: text("executive_summary").notNull(),
  wins: text("wins", { mode: "json" }).$type<string[]>().notNull(),
  risks: text("risks", { mode: "json" }).$type<string[]>().notNull(),
  opportunities: text("opportunities", { mode: "json" }).$type<string[]>().notNull(),
  recommendedActions: text("recommended_actions", { mode: "json" }).$type<string[]>().notNull(),
  keyNumbers: text("key_numbers", { mode: "json" }).$type<Record<string, number>>().notNull(),
  evidenceFindingRefs: text("evidence_finding_refs", { mode: "json" }).$type<string[]>().notNull(),
  confidence: real("confidence").notNull(),
  promptVersion: text("prompt_version").notNull(),
  model: text("model").notNull(),
  isFallback: integer("is_fallback", { mode: "boolean" }).notNull(),
  generatedAt: integer("generated_at", { mode: "timestamp" }).notNull(),
});

export const deliveries = sqliteTable("deliveries", {
  id: text("id").primaryKey(),
  briefId: text("brief_id").notNull().references(() => briefs.id),
  channel: text("channel").notNull(),
  status: text("status").notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
});

export type OrganizationRow = typeof organizations.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type MembershipRow = typeof memberships.$inferSelect;
export type DataConnectionRow = typeof dataConnections.$inferSelect;
export type SyncRunRow = typeof syncRuns.$inferSelect;
export type MetricRow = typeof metrics.$inferSelect;
export type TargetRow = typeof targets.$inferSelect;
export type FindingRow = typeof findings.$inferSelect;
export type BriefRow = typeof briefs.$inferSelect;
export type DeliveryRow = typeof deliveries.$inferSelect;
