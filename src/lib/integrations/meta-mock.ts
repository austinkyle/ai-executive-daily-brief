import type { DataProvider } from "./provider";
import { generateScenario } from "./scenario-generator";

export const metaMockProvider: DataProvider = {
  providerKey: "meta",
  fetchDailyMetrics(date) {
    return generateScenario().filter(
      (metric) =>
        metric.date === date &&
        metric.domain === "marketing" &&
        metric.entityId.startsWith("meta-"),
    );
  },
};
