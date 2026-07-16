import type { DataProvider } from "./provider";
import { generateScenario } from "./scenario-generator";

export const googleAdsMockProvider: DataProvider = {
  providerKey: "google-ads",
  fetchDailyMetrics(date) {
    return generateScenario().filter(
      (metric) =>
        metric.date === date &&
        metric.domain === "marketing" &&
        metric.entityId === "google-branded-search",
    );
  },
};
