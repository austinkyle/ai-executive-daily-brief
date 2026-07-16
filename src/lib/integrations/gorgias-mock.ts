import type { DataProvider } from "./provider";
import { generateScenario } from "./scenario-generator";

export const gorgiasMockProvider: DataProvider = {
  providerKey: "gorgias",
  fetchDailyMetrics(date) {
    return generateScenario().filter(
      (metric) => metric.date === date && metric.domain === "support",
    );
  },
};
