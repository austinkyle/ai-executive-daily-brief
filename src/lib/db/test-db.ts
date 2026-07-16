import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

export function createTestDb(): {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
} {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
CREATE TABLE organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE memberships (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL);
CREATE TABLE data_connections (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, provider_key TEXT NOT NULL, display_name TEXT NOT NULL, is_simulated INTEGER NOT NULL, status TEXT NOT NULL, last_synced_at INTEGER, credentials_ref TEXT);
CREATE TABLE sync_runs (id TEXT PRIMARY KEY, connection_id TEXT NOT NULL, org_id TEXT NOT NULL, run_date TEXT NOT NULL, status TEXT NOT NULL, started_at INTEGER NOT NULL, finished_at INTEGER, error TEXT);
CREATE TABLE metrics (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, date TEXT NOT NULL, domain TEXT NOT NULL, metric_key TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, value REAL NOT NULL, unit TEXT NOT NULL);
CREATE TABLE targets (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, metric_key TEXT NOT NULL, month TEXT NOT NULL, target_value REAL NOT NULL);
CREATE TABLE findings (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, date TEXT NOT NULL, domain TEXT NOT NULL, severity TEXT NOT NULL, title TEXT NOT NULL, what_changed TEXT NOT NULL, why_it_matters TEXT NOT NULL, confidence REAL NOT NULL, score REAL NOT NULL, evidence_metric_refs TEXT NOT NULL, recommended_next_step TEXT NOT NULL);
CREATE TABLE briefs (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL, overall_status TEXT NOT NULL, executive_summary TEXT NOT NULL, wins TEXT NOT NULL, risks TEXT NOT NULL, opportunities TEXT NOT NULL, recommended_actions TEXT NOT NULL, key_numbers TEXT NOT NULL, evidence_finding_refs TEXT NOT NULL, confidence REAL NOT NULL, prompt_version TEXT NOT NULL, model TEXT NOT NULL, is_fallback INTEGER NOT NULL, generated_at INTEGER NOT NULL);
CREATE TABLE deliveries (id TEXT PRIMARY KEY, brief_id TEXT NOT NULL, channel TEXT NOT NULL, status TEXT NOT NULL, sent_at INTEGER NOT NULL);
`);

  return { db: drizzle(sqlite, { schema }), sqlite };
}
