import { describe, expect, it } from "vitest";

import { guessUnitForMetricKey, humanizeMetricKey } from "./format";

describe("humanizeMetricKey", () => {
  it("converts snake case metric keys to title case", () => {
    expect(humanizeMetricKey("checkout_conversion_rate")).toBe("Checkout Conversion Rate");
    expect(humanizeMetricKey("revenue")).toBe("Revenue");
    expect(humanizeMetricKey("CTR_rate")).toBe("CTR Rate");
  });

  it("preserves empty underscore segments", () => {
    expect(humanizeMetricKey("_net_sales_")).toBe(" Net Sales ");
  });
});

describe("guessUnitForMetricKey", () => {
  it.each(["sales", "revenue", "spend", "aov", "value", "cost", "refund"])("identifies %s as currency", (token) => {
    expect(guessUnitForMetricKey(`daily_${token}`)).toBe("currency");
  });

  it.each(["rate", "ctr", "cvr", "margin", "percent"])("identifies %s as percent", (token) => {
    expect(guessUnitForMetricKey(`daily_${token}`)).toBe("percent");
  });

  it("matches tokens case-insensitively and prioritizes currency", () => {
    expect(guessUnitForMetricKey("Net_ReVeNuE_Rate")).toBe("currency");
  });

  it("returns number for unmapped keys", () => {
    expect(guessUnitForMetricKey("open_tickets")).toBe("number");
  });
});
