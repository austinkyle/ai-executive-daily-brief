"use server";

import { revalidatePath } from "next/cache";
import { generateBrief } from "@/lib/ai/generate";
import db from "@/lib/db/client";
import type { BriefRow } from "@/lib/db/schema";
import { getBriefByDate, getDemoOrg, TODAY } from "@/lib/web/queries";

export async function generateTodaysBrief(): Promise<BriefRow> {
  const org = getDemoOrg(db);
  const existing = getBriefByDate(db, org.id, TODAY);
  if (existing) return existing;
  const brief = await generateBrief(db, org.id, TODAY);
  revalidatePath("/");
  revalidatePath("/history");
  return brief;
}
