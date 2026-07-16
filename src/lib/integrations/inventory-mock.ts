import type { DataProvider } from "./provider";
import { generateScenario } from "./scenario-generator";

export const inventoryMockProvider: DataProvider = {
  providerKey: "inventory",
  fetchDailyMetrics(date) {
    return generateScenario().filter(
      (metric) => metric.date === date && metric.domain === "inventory",
    );
  },
};
