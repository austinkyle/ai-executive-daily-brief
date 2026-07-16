import type { DataProvider } from "./provider";
import { generateScenario } from "./scenario-generator";

export const klaviyoMockProvider: DataProvider = {
  providerKey: "klaviyo",
  fetchDailyMetrics(date) {
    return generateScenario().filter(
      (metric) => metric.date === date && metric.domain === "email",
    );
  },
};
