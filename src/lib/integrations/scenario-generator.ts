import { createPrng } from "@/lib/util/prng";

import type { NormalizedMetric } from "./provider";

export const SCENARIO_SEED = 20260617;
export const SCENARIO_START_DATE = "2026-06-17";

const DAYS = 30;
const skuDefinitions = [
  { id: "trailhead-35l-pack", unitsSold: 40, refundRate: 0.015, price: 140 },
  { id: "glacier-bottle-24oz", unitsSold: 15, refundRate: 0.02, price: 35 },
  { id: "ridgeline-multitool", unitsSold: 10, refundRate: 0.015, price: 60 },
] as const;
const metaCampaigns = [
  { id: "meta-retargeting-core", spend: 800 },
  { id: "meta-prospecting-bestseller", spend: 1500 },
  { id: "meta-prospecting-ridgeline", spend: 300 },
] as const;
const emailFlows = [
  { id: "abandoned_cart", revenueStart: 900, revenueEnd: 1500 },
  { id: "welcome_series", revenueStart: 500, revenueEnd: 780 },
] as const;
const supportReasons = ["shipping_delay", "product_question", "other"] as const;

function noise(rng: () => number, amplitude: number): number {
  return 1 + (rng() * 2 - 1) * amplitude;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function interpolate(start: number, end: number, position: number, steps: number): number {
  return start + ((end - start) * position) / steps;
}

function metric(
  date: string,
  domain: string,
  metricKey: string,
  entityType: string,
  entityId: string,
  value: number,
  unit: string,
): NormalizedMetric {
  return { date, domain, metricKey, entityType, entityId, value, unit };
}

export function dateForDayIndex(dayIndex: number): string {
  return new Date(Date.UTC(2026, 5, 17 + dayIndex)).toISOString().slice(0, 10);
}

export function dayIndexForDate(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match === null) {
    throw new Error(`Invalid ISO date: ${date}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Invalid ISO date: ${date}`);
  }
  return Math.round((parsed.getTime() - Date.UTC(2026, 5, 17)) / 86_400_000);
}

export function generateScenario(): NormalizedMetric[] {
  const rng = createPrng(SCENARIO_SEED);
  const metrics: NormalizedMetric[] = [];
  let unitsOnHand = 1400;
  const trailheadSales: number[] = [];
  const returningBase = 2400 * 0.026 * 92 * 0.45;

  for (let day = 0; day < DAYS; day++) {
    const date = dateForDayIndex(day);
    const sessions = Math.round(2400 * noise(rng, 0.03));
    const conversionBase = day < 24 ? 0.026 : interpolate(0.0245, 0.0205, day - 24, 5);
    const conversionRate = round(conversionBase * noise(rng, 0.01), 4);
    const orders = Math.round(sessions * conversionRate);
    const aov = round(92 * noise(rng, 0.02), 2);
    const grossSales = round(orders * aov, 2);
    const returningRevenue = round(returningBase * (1 + (0.02 * day) / 29) * noise(rng, 0.02), 2);
    const newRevenue = round(Math.max(0, grossSales - returningRevenue), 2);
    metrics.push(
      metric(date, "commerce", "sessions", "org", "org", sessions, "count"),
      metric(date, "commerce", "conversion_rate", "org", "org", conversionRate, "ratio"),
      metric(date, "commerce", "orders", "org", "org", orders, "count"),
      metric(date, "commerce", "aov", "org", "org", aov, "currency"),
      metric(date, "commerce", "gross_sales", "org", "org", grossSales, "currency"),
      metric(date, "commerce", "returning_customer_revenue", "org", "org", returningRevenue, "currency"),
      metric(date, "commerce", "new_customer_revenue", "org", "org", newRevenue, "currency"),
    );

    const skuSales: number[] = [];
    for (const sku of skuDefinitions) {
      const unitsSold = Math.round(sku.unitsSold * noise(rng, 0.1));
      skuSales.push(unitsSold);
      metrics.push(metric(date, "commerce", "units_sold", "sku", sku.id, unitsSold, "count"));
    }
    for (const [index, sku] of skuDefinitions.entries()) {
      const baseRate = sku.id === "glacier-bottle-24oz" && day >= 20 ? 0.09 : sku.refundRate;
      const amplitude = sku.id === "glacier-bottle-24oz" ? 0.03 : 0.05;
      const refundRate = round(baseRate * noise(rng, amplitude), 4);
      metrics.push(
        metric(date, "commerce", "refund_rate", "sku", sku.id, refundRate, "ratio"),
        metric(date, "commerce", "refunds_amount", "sku", sku.id, round(skuSales[index]! * refundRate * sku.price, 2), "currency"),
      );
    }

    const trailheadUnitsSold = skuSales[0]!;
    unitsOnHand -= trailheadUnitsSold;
    trailheadSales.push(trailheadUnitsSold);
    const trailingSales = trailheadSales.slice(Math.max(0, day - 6));
    const trailingAverage = trailingSales.reduce((sum, value) => sum + value, 0) / trailingSales.length;
    metrics.push(
      metric(date, "inventory", "units_on_hand", "sku", "trailhead-35l-pack", unitsOnHand, "count"),
      metric(date, "inventory", "days_of_inventory", "sku", "trailhead-35l-pack", round(unitsOnHand / trailingAverage, 2), "days"),
    );

    for (const campaign of metaCampaigns) {
      const spend = round(campaign.spend * noise(rng, 0.05), 2);
      let cpaBase: number;
      let roasBase: number;
      let ctrBase: number;
      let cpaAmplitude: number;
      let collapse = false;
      if (campaign.id === "meta-retargeting-core") {
        cpaBase = interpolate(18, 30, day, 29);
        roasBase = 4.2;
        ctrBase = 0.021;
        cpaAmplitude = 0.02;
      } else if (campaign.id === "meta-prospecting-bestseller") {
        collapse = day >= 21;
        const position = Math.max(0, day - 21);
        cpaBase = collapse ? interpolate(32, 95, position, 8) : 32;
        roasBase = collapse ? interpolate(3.8, 0.9, position, 8) : 3.8;
        ctrBase = collapse ? interpolate(0.011, 0.004, position, 8) : 0.011;
        cpaAmplitude = collapse ? 0.02 : 0.03;
      } else {
        cpaBase = 14;
        roasBase = 6.5;
        ctrBase = 0.018;
        cpaAmplitude = 0.03;
      }
      const cpa = round(cpaBase * noise(rng, cpaAmplitude), 2);
      const signalAmplitude = collapse ? 0.02 : 0.05;
      const roas = round(roasBase * noise(rng, signalAmplitude), 4);
      const ctr = round(ctrBase * noise(rng, signalAmplitude), 4);
      metrics.push(
        metric(date, "marketing", "spend", "campaign", campaign.id, spend, "currency"),
        metric(date, "marketing", "cpa", "campaign", campaign.id, cpa, "currency"),
        metric(date, "marketing", "roas", "campaign", campaign.id, roas, "ratio"),
        metric(date, "marketing", "ctr", "campaign", campaign.id, ctr, "ratio"),
        metric(date, "marketing", "attributed_revenue", "campaign", campaign.id, round(spend * roas, 2), "currency"),
      );
    }

    const googleSpend = round(600 * noise(rng, 0.04), 2);
    const googleCpa = round(22 * noise(rng, 0.03), 2);
    const googleRoas = round(3 * noise(rng, 0.04), 4);
    const googleCtr = round(0.01 * noise(rng, 0.04), 4);
    metrics.push(
      metric(date, "marketing", "spend", "campaign", "google-branded-search", googleSpend, "currency"),
      metric(date, "marketing", "cpa", "campaign", "google-branded-search", googleCpa, "currency"),
      metric(date, "marketing", "roas", "campaign", "google-branded-search", googleRoas, "ratio"),
      metric(date, "marketing", "ctr", "campaign", "google-branded-search", googleCtr, "ratio"),
      metric(date, "marketing", "attributed_revenue", "campaign", "google-branded-search", round(googleSpend * googleRoas, 2), "currency"),
    );

    for (const flow of emailFlows) {
      const revenue = round(interpolate(flow.revenueStart, flow.revenueEnd, day, 29) * noise(rng, 0.03), 2);
      const openRate = round(0.45 * noise(rng, 0.02), 4);
      const clickRate = round(0.08 * noise(rng, 0.02), 4);
      metrics.push(
        metric(date, "email", "flow_revenue", "flow", flow.id, revenue, "currency"),
        metric(date, "email", "open_rate", "flow", flow.id, openRate, "ratio"),
        metric(date, "email", "click_rate", "flow", flow.id, clickRate, "ratio"),
      );
    }

    for (const reason of supportReasons) {
      const shippingRamp = reason === "shipping_delay" && day >= 20;
      const baseline = reason === "shipping_delay" ? (shippingRamp ? interpolate(8, 28, day - 20, 9) : 8) : reason === "product_question" ? 12 : 6;
      metrics.push(metric(date, "support", "ticket_count", "contact_reason", reason, Math.round(baseline * noise(rng, shippingRamp ? 0.05 : 0.1)), "count"));
    }
  }

  return metrics;
}
