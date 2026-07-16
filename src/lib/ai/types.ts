import type { findings } from "@/lib/db/schema";

export type FindingForPrompt = Pick<
  typeof findings.$inferSelect,
  | "id"
  | "domain"
  | "severity"
  | "title"
  | "whatChanged"
  | "whyItMatters"
  | "recommendedNextStep"
  | "confidence"
  | "score"
>;
