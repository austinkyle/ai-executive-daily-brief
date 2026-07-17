import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { generateBrief } from "@/lib/ai/generate";
import type { BriefRow, DeliveryRow } from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";
import { getBriefByDate } from "@/lib/web/queries";

import { simulateDelivery } from "./simulate-delivery";

export async function generateAndDeliverBrief(db: BetterSQLite3Database<typeof schema>, orgId: string, date: string): Promise<{ brief: BriefRow; deliveries: DeliveryRow[] }> {
  const existing = getBriefByDate(db, orgId, date);
  const brief = existing ?? await generateBrief(db, orgId, date);
  return { brief, deliveries: simulateDelivery(db, brief.id) };
}
