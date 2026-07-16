import { env } from "@/lib/env";

import { buildFallbackContent } from "./fallback-templates";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { BriefContentSchema, type BriefContent } from "./schema";
import type { FindingForPrompt } from "./types";

export interface LlmGenerationInput {
  findings: FindingForPrompt[];
  retryFeedback?: string;
}

export interface LlmClient {
  generate(input: LlmGenerationInput): Promise<BriefContent>;
}

export class OpenAiCompatibleLlmClient implements LlmClient {
  async generate(input: LlmGenerationInput): Promise<BriefContent> {
    const response = await fetch(
      `${env.LLM_BASE_URL ?? "https://api.openai.com/v1"}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.LLM_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(input.findings, input.retryFeedback) },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("LLM response did not include message content");
    }

    return BriefContentSchema.parse(JSON.parse(content));
  }
}

export class FallbackLlmClient implements LlmClient {
  generate(input: LlmGenerationInput): Promise<BriefContent> {
    return Promise.resolve(buildFallbackContent(input.findings));
  }
}
