import type { DataProvider } from "./provider";
import { generateScenario } from "./scenario-generator";

export const shopifyMockProvider: DataProvider = {
  providerKey: "shopify",
  fetchDailyMetrics(date) {
    return generateScenario().filter(
      (metric) => metric.date === date && metric.domain === "commerce",
    );
  },
};
