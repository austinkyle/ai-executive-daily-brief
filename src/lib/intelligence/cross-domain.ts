import { windowTrend } from "@/lib/analytics/compare";

import type { FindingDraft, MetricPoint, MetricSeriesGroup } from "./types";

function lastNPointIds(points: MetricPoint[], n: number): string[] {
  return [...points].sort((a, b) => a.date.localeCompare(b.date)).slice(-n).map((p) => p.id);
}

function sumByDate(groups: MetricSeriesGroup[]): { date: string; value: number }[] {
  const values = new Map<string, number>();
  for (const group of groups) {
    for (const point of group.points) values.set(point.date, (values.get(point.date) ?? 0) + point.value);
  }
  return [...values.entries()].map(([date, value]) => ({ date, value }));
}

const trend = (points: MetricPoint[], days: number) => windowTrend(points.map((p) => ({ date: p.date, value: p.value })), days);

export function detectConversionIssue(groups: MetricSeriesGroup[], asOfDate: string): FindingDraft | null {
  const commerce = groups.filter((group) => group.domain === "commerce" && group.entityType === "org");
  const sessions = commerce.find((group) => group.metricKey === "sessions");
  const cvr = commerce.find((group) => group.metricKey === "conversion_rate");
  const newRevenue = commerce.find((group) => group.metricKey === "new_customer_revenue");
  const returningRevenue = commerce.find((group) => group.metricKey === "returning_customer_revenue");
  if (sessions === undefined || cvr === undefined || newRevenue === undefined || returningRevenue === undefined) return null;

  const sessionsTrend = trend(sessions.points, 7);
  const cvrTrend = trend(cvr.points, 7);
  const newRevenueTrend = trend(newRevenue.points, 7);
  const returningRevenueTrend = trend(returningRevenue.points, 7);
  if (sessionsTrend.percentChange === null || Math.abs(sessionsTrend.percentChange) > 0.05 || cvrTrend.percentChange === null || cvrTrend.percentChange > -0.1 || newRevenueTrend.percentChange === null || newRevenueTrend.percentChange > -0.1 || returningRevenueTrend.percentChange === null || returningRevenueTrend.percentChange < -0.05) return null;

  return {
    ruleId: "conversion-issue", domain: "commerce", entityType: "org", entityId: sessions.entityId, severity: "warning", confidence: 0.85,
    // A storewide conversion decline is a top-line causal finding; its percent-change
    // magnitude is scaled (×10) onto the same range trend-multiple rules occupy so it
    // is not outranked by narrower single-entity findings.
    magnitude: Math.abs(cvrTrend.percentChange) * 10,
    evidenceMetricIds: [...lastNPointIds(cvr.points, 7), ...lastNPointIds(newRevenue.points, 7), ...lastNPointIds(returningRevenue.points, 7)],
    date: asOfDate, title: "Conversion rate declining while traffic holds steady",
    whatChanged: `Sessions are flat (${(sessionsTrend.percentChange * 100).toFixed(1)}% change) but conversion rate fell ${(cvrTrend.percentChange * 100).toFixed(1)}%; new-customer revenue absorbed the decline (${(newRevenueTrend.percentChange * 100).toFixed(1)}%) while returning-customer revenue stayed resilient (${(returningRevenueTrend.percentChange * 100).toFixed(1)}%).`,
    whyItMatters: "A conversion-rate decline with flat traffic and resilient repeat revenue points to an on-site or new-visitor experience issue rather than a demand or loyalty problem.",
    recommendedNextStep: "Audit the new-visitor purchase funnel (landing pages, checkout, site speed) for regressions.",
  };
}

export function detectSpendOutpacingRevenue(groups: MetricSeriesGroup[], asOfDate: string): FindingDraft | null {
  const spendGroups = groups.filter((group) => group.domain === "marketing" && group.metricKey === "spend");
  const revenueGroups = groups.filter((group) => group.domain === "marketing" && group.metricKey === "attributed_revenue");
  if (spendGroups.length === 0 || revenueGroups.length === 0) return null;
  const spendTrend = windowTrend(sumByDate(spendGroups), 7);
  const revenueTrend = windowTrend(sumByDate(revenueGroups), 7);
  if (spendTrend.percentChange === null || spendTrend.percentChange < 0.1 || revenueTrend.percentChange === null || revenueTrend.percentChange >= 0) return null;
  return {
    ruleId: "spend-outpacing-revenue", domain: "marketing", entityType: "account", entityId: "blended-account", severity: "warning", confidence: 0.8, magnitude: Math.abs(revenueTrend.percentChange),
    evidenceMetricIds: [...spendGroups.flatMap((group) => lastNPointIds(group.points, 7)), ...revenueGroups.flatMap((group) => lastNPointIds(group.points, 7))], date: asOfDate,
    title: "Blended marketing spend rising while attributed revenue falls",
    whatChanged: `Blended spend rose ${(spendTrend.percentChange * 100).toFixed(1)}% while blended attributed revenue moved ${(revenueTrend.percentChange * 100).toFixed(1)}% over the trailing window.`,
    whyItMatters: "Spending more for less attributed revenue signals eroding blended paid-media efficiency across the account.",
    recommendedNextStep: "Reallocate budget away from underperforming campaigns toward efficient ones.",
  };
}

export function detectRefundSkuIsolation(groups: MetricSeriesGroup[], asOfDate: string): FindingDraft | null {
  const refundGroups = groups.filter((group) => group.domain === "commerce" && group.metricKey === "refund_rate" && group.entityType === "sku");
  if (refundGroups.length < 2) return null;
  const spiking = refundGroups.map((group) => ({ group, result: trend(group.points, 10) })).find(({ result }) => result.percentChange !== null && result.percentChange > 1.0);
  if (spiking === undefined || spiking.result.percentChange === null) return null;
  const flat = refundGroups.filter((group) => group !== spiking.group).map((group) => ({ group, result: trend(group.points, 10) })).find(({ result }) => result.percentChange === null || Math.abs(result.percentChange) <= 0.3);
  if (flat === undefined) return null;
  const flatChange = flat.result.percentChange === null ? "no comparable change" : `${(flat.result.percentChange * 100).toFixed(1)}%`;
  return {
    ruleId: "refund-sku-isolation", domain: "commerce", entityType: "sku", entityId: spiking.group.entityId, severity: "warning", confidence: 0.85, magnitude: Math.abs(spiking.result.percentChange), evidenceMetricIds: lastNPointIds(spiking.group.points, 10), date: asOfDate,
    title: `Refund rate spike isolated to ${spiking.group.entityId}`,
    whatChanged: `${spiking.group.entityId} refund rate rose ${(spiking.result.percentChange * 100).toFixed(1)}% over the trailing window while ${flat.group.entityId} stayed flat (${flatChange}), confirming the issue is isolated to one SKU rather than a storewide return-policy change.`,
    whyItMatters: "An isolated refund spike points to a product-specific quality or fulfillment defect that can be fixed without a policy-wide response.",
    recommendedNextStep: `Inspect recent manufacturing, packaging, or fulfillment changes specific to ${spiking.group.entityId}.`,
  };
}

export function detectTicketsShippingInventory(groups: MetricSeriesGroup[], asOfDate: string): FindingDraft | null {
  const tickets = groups.find((group) => group.domain === "support" && group.metricKey === "ticket_count" && group.entityId === "shipping_delay");
  if (tickets === undefined) return null;
  const ticketsTrend = trend(tickets.points, 10);
  if (ticketsTrend.percentChange === null || ticketsTrend.percentChange <= 0.5) return null;
  const inventory = groups.filter((group) => group.domain === "inventory" && group.metricKey === "days_of_inventory").map((group) => ({ group, point: [...group.points].sort((a, b) => a.date.localeCompare(b.date)).at(-1) })).find(({ point }) => point !== undefined && point.value < 10);
  if (inventory === undefined || inventory.point === undefined) return null;
  return {
    ruleId: "tickets-shipping-inventory", domain: "support", entityType: "contact_reason", entityId: "shipping_delay", severity: "warning", confidence: 0.8, magnitude: Math.abs(ticketsTrend.percentChange), evidenceMetricIds: [...lastNPointIds(tickets.points, 10), inventory.point.id], date: asOfDate,
    title: "Rising shipping complaints correlate with tightening inventory",
    whatChanged: `Shipping-delay tickets rose ${(ticketsTrend.percentChange * 100).toFixed(1)}% over the trailing window while ${inventory.group.entityId} inventory dropped to ${inventory.point.value.toFixed(1)} days on hand.`,
    whyItMatters: "Rising shipping complaints alongside falling inventory suggests fulfillment strain is compounding a supply issue.",
    recommendedNextStep: `Expedite replenishment for ${inventory.group.entityId} and review carrier performance.`,
  };
}

export function evaluateCrossDomainRules(groups: MetricSeriesGroup[], asOfDate: string): FindingDraft[] {
  return [detectConversionIssue(groups, asOfDate), detectSpendOutpacingRevenue(groups, asOfDate), detectRefundSkuIsolation(groups, asOfDate), detectTicketsShippingInventory(groups, asOfDate)].filter((finding): finding is FindingDraft => finding !== null);
}
