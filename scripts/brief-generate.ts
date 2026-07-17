import db from "@/lib/db/client";
import { generateAndDeliverBrief } from "@/lib/delivery/generate-and-deliver";
import { getDemoOrg, TODAY } from "@/lib/web/queries";

async function generate(): Promise<void> {
  const date = process.argv[2] ?? TODAY;
  const org = getDemoOrg(db);
  const { brief, deliveries } = await generateAndDeliverBrief(db, org.id, date);
  console.log({ brief: { id: brief.id, date: brief.date, overallStatus: brief.overallStatus }, deliveries: deliveries.map(({ channel, status }) => ({ channel, status })) });
}

generate().catch((error) => { console.error(error); process.exitCode = 1; });
