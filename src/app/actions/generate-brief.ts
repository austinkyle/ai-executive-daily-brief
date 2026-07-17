"use server";

import { revalidatePath } from "next/cache";
import { generateAndDeliverBrief } from "@/lib/delivery/generate-and-deliver";
import db from "@/lib/db/client";
import type { BriefRow } from "@/lib/db/schema";
import { getDemoOrg, TODAY } from "@/lib/web/queries";

export async function generateTodaysBrief(): Promise<BriefRow> {
  const org = getDemoOrg(db);
  const { brief } = await generateAndDeliverBrief(db, org.id, TODAY);
  revalidatePath("/");
  revalidatePath("/history");
  return brief;
}
