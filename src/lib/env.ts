import { z } from "zod";

const envSchema = z.object({
  DATABASE_PATH: z.string().trim().min(1).default("./data/app.db"),
  LLM_API_KEY: z.string().optional(),
  LLM_BASE_URL: z.url().optional(),
});

export function parseEnv(raw: Record<string, string | undefined>) {
  const result = envSchema.safeParse({
    DATABASE_PATH: raw.DATABASE_PATH,
    LLM_API_KEY: raw.LLM_API_KEY,
    LLM_BASE_URL: raw.LLM_BASE_URL,
  });

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return result.data;
}

export const env = parseEnv(process.env);
