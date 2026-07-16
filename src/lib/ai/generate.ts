import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";

import { buildKeyNumbers } from "./key-numbers";
import { FallbackLlmClient, type LlmClient, OpenAiCompatibleLlmClient } from "./llm-client";
import { PROMPT_VERSION } from "./prompt";
import type { BriefContent } from "./schema";
import type { FindingForPrompt } from "./types";

export async function generateBrief(
  db: BetterSQLite3Database<typeof schema>,
  orgId: string,
  date: string,
  clientOverride?: LlmClient,
): Promise<typeof schema.briefs.$inferSelect> {
  const findings: (typeof schema.findings.$inferSelect)[] = db
    .select()
    .from(schema.findings)
    .where(and(eq(schema.findings.orgId, orgId), eq(schema.findings.date, date)))
    .orderBy(desc(schema.findings.score))
    .all();
  const validIds = new Set(findings.map((finding) => finding.id));
  const findingsForPrompt: FindingForPrompt[] = findings.map((finding) => ({
    id: finding.id,
    domain: finding.domain,
    severity: finding.severity,
    title: finding.title,
    whatChanged: finding.whatChanged,
    whyItMatters: finding.whyItMatters,
    recommendedNextStep: finding.recommendedNextStep,
    confidence: finding.confidence,
    score: finding.score,
  }));
  const usingRealClient = clientOverride
    ? clientOverride instanceof OpenAiCompatibleLlmClient
    : Boolean(env.LLM_API_KEY);
  const client: LlmClient = clientOverride ?? (
    env.LLM_API_KEY ? new OpenAiCompatibleLlmClient() : new FallbackLlmClient()
  );

  function assertEvidenceRefsValid(refs: string[]): void {
    const invalid = refs.filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
      throw new Error(`Evidence refs not found in input findings: ${invalid.join(", ")}`);
    }
  }

  let content: BriefContent;
  let isFallback = client instanceof FallbackLlmClient;
  try {
    content = await client.generate({ findings: findingsForPrompt });
    assertEvidenceRefsValid(content.evidence_refs);
  } catch (firstError) {
    if (usingRealClient) {
      try {
        content = await client.generate({
          findings: findingsForPrompt,
          retryFeedback: firstError instanceof Error ? firstError.message : String(firstError),
        });
        assertEvidenceRefsValid(content.evidence_refs);
      } catch {
        content = await new FallbackLlmClient().generate({ findings: findingsForPrompt });
        isFallback = true;
      }
    } else {
      content = await new FallbackLlmClient().generate({ findings: findingsForPrompt });
      isFallback = true;
    }
  }

  const keyNumbers = await buildKeyNumbers(db, findings);
  const [row] = db
    .insert(schema.briefs)
    .values({
      id: randomUUID(),
      orgId,
      date,
      status: "generated",
      overallStatus: content.overall_status,
      executiveSummary: content.executive_summary,
      wins: content.wins,
      risks: content.risks,
      opportunities: content.opportunities,
      recommendedActions: content.recommended_actions,
      keyNumbers,
      evidenceFindingRefs: content.evidence_refs,
      confidence: content.confidence,
      promptVersion: PROMPT_VERSION,
      model: isFallback ? "deterministic-fallback" : env.LLM_MODEL,
      isFallback,
      generatedAt: new Date(),
    })
    .returning()
    .all();

  return row;
}
