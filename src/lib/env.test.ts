import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("parses a valid environment", () => {
    expect(
      parseEnv({
        DATABASE_PATH: "./data/test.db",
        LLM_API_KEY: "demo-key",
        LLM_BASE_URL: "https://llm.example.com/v1",
      }),
    ).toEqual({
      DATABASE_PATH: "./data/test.db",
      LLM_API_KEY: "demo-key",
      LLM_BASE_URL: "https://llm.example.com/v1",
    });
  });

  it("rejects an explicitly empty database path", () => {
    expect(() => parseEnv({ DATABASE_PATH: "" })).toThrow(
      "Invalid environment configuration",
    );
  });

  it("rejects an invalid LLM base URL", () => {
    expect(() =>
      parseEnv({ DATABASE_PATH: "./data/test.db", LLM_BASE_URL: "not-a-url" }),
    ).toThrow("Invalid environment configuration");
  });
});
