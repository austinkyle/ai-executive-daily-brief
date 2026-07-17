import db from "@/lib/db/client";
import { generateAndDeliverBrief } from "@/lib/delivery/generate-and-deliver";
import { getDemoOrg, TODAY } from "@/lib/web/queries";

// future cron target -- POST here on a schedule instead of a long-running daemon (see docs/architecture.md).
export async function POST(request: Request) {
  try {
    let body: { date?: string } = {};
    try { body = await request.json() as { date?: string }; } catch {}
    const org = getDemoOrg(db);
    const { brief, deliveries } = await generateAndDeliverBrief(db, org.id, body.date ?? TODAY);
    return Response.json({ brief, deliveries });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
