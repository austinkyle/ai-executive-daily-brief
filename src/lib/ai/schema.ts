import { z } from "zod";

export const OverallStatusSchema = z.enum(["strong", "stable", "mixed", "at_risk"]);
export type OverallStatus = z.infer<typeof OverallStatusSchema>;

export const BriefContentSchema = z.object({
  overall_status: OverallStatusSchema,
  executive_summary: z.string().min(1),
  wins: z.array(z.string().min(1)),
  risks: z.array(z.string().min(1)),
  opportunities: z.array(z.string().min(1)),
  recommended_actions: z.array(z.string().min(1)).max(5),
  evidence_refs: z.array(z.string().min(1)),
  confidence: z.number().min(0).max(1),
});
export type BriefContent = z.infer<typeof BriefContentSchema>;
