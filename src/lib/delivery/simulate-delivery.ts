import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { deliveries, type DeliveryRow } from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";

export function simulateDelivery(db: BetterSQLite3Database<typeof schema>, briefId: string): DeliveryRow[] {
  const existing = db.select().from(deliveries).where(eq(deliveries.briefId, briefId)).all();
  if (existing.length) return existing;
  return db.insert(deliveries).values([{ id: randomUUID(), briefId, channel: "email", status: "sent", sentAt: new Date() }, { id: randomUUID(), briefId, channel: "slack", status: "sent", sentAt: new Date() }]).returning().all();
}
