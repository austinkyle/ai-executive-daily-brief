import { dayOverDay, sameWeekdayWoW, windowTrend } from "@/lib/analytics/compare";

import type { FindingDraft, MetricPoint, MetricSeriesGroup, Severity } from "./types";

export interface RuleEvalContext {
  entityId: string;
  entityType: string;
  domain: string;
  metricKey: string;
  unit: string;
  value: number;
  percentChange: number | null;
  current: number | null;
  previous: number | null;
  startAverage: number | null;
  endAverage: number | null;
}

export interface ThresholdRule {
  id: string;
  domain: string;
  metricKey: string;
  entityType: string;
  comparisonType: "latestValue" | "dayOverDay" | "sameWeekdayWoW" | "windowTrend";
  windowDays?: number;
  operator: "gt" | "lt";
  threshold: number;
  severity: Severity;
  confidence: number;
  title: (ctx: RuleEvalContext) => string;
  whatChanged: (ctx: RuleEvalContext) => string;
  whyItMatters: (ctx: RuleEvalContext) => string;
  recommendedNextStep: (ctx: RuleEvalContext) => string;
}

function shiftDate(date: string, delta: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  result.setUTCDate(result.getUTCDate() + delta);
  return result.toISOString().slice(0, 10);
}

function definedPointIds(points: Array<MetricPoint | undefined>): string[] {
  return points.flatMap((point) => (point === undefined ? [] : [point.id]));
}

export function evaluateRules(rules: ThresholdRule[], groups: MetricSeriesGroup[], asOfDate: string): FindingDraft[] {
  const findings: FindingDraft[] = [];

  for (const rule of rules) {
    for (const group of groups) {
      if (group.domain !== rule.domain || group.metricKey !== rule.metricKey || group.entityType !== rule.entityType) continue;

      const points = [...group.points].sort((left, right) => left.date.localeCompare(right.date));
      let compareValue: number | null = null;
      let context: RuleEvalContext | null = null;
      let evidenceMetricIds: string[] = [];

      if (rule.comparisonType === "latestValue") {
        const point = points.find((item) => item.date === asOfDate);
        if (point === undefined) continue;
        compareValue = point.value;
        context = { entityId: group.entityId, entityType: group.entityType, domain: group.domain, metricKey: group.metricKey, unit: group.unit, value: point.value, percentChange: null, current: point.value, previous: null, startAverage: null, endAverage: null };
        evidenceMetricIds = [point.id];
      } else if (rule.comparisonType === "dayOverDay" || rule.comparisonType === "sameWeekdayWoW") {
        const comparison = rule.comparisonType === "dayOverDay" ? dayOverDay(points, asOfDate) : sameWeekdayWoW(points, asOfDate);
        if (comparison.percentChange === null || comparison.current === null) continue;
        compareValue = comparison.percentChange;
        context = { entityId: group.entityId, entityType: group.entityType, domain: group.domain, metricKey: group.metricKey, unit: group.unit, value: comparison.current, percentChange: comparison.percentChange, current: comparison.current, previous: comparison.previous, startAverage: null, endAverage: null };
        const priorDate = shiftDate(asOfDate, rule.comparisonType === "dayOverDay" ? -1 : -7);
        evidenceMetricIds = definedPointIds([points.find((point) => point.date === asOfDate), points.find((point) => point.date === priorDate)]);
      } else {
        const trend = windowTrend(points, rule.windowDays!);
        if (trend.percentChange === null || trend.endAverage === null) continue;
        compareValue = trend.percentChange;
        context = { entityId: group.entityId, entityType: group.entityType, domain: group.domain, metricKey: group.metricKey, unit: group.unit, value: trend.endAverage, percentChange: trend.percentChange, current: null, previous: null, startAverage: trend.startAverage, endAverage: trend.endAverage };
        const windowDays = rule.windowDays!;
        evidenceMetricIds = [...new Set([...points.slice(0, windowDays).map((point) => point.id), ...points.slice(-windowDays).map((point) => point.id)])];
      }

      if (compareValue === null || context === null) continue;
      const triggered = rule.operator === "gt" ? compareValue > rule.threshold : compareValue < rule.threshold;
      if (!triggered) continue;

      findings.push({ ruleId: rule.id, domain: group.domain, entityType: group.entityType, entityId: group.entityId, severity: rule.severity, title: rule.title(context), whatChanged: rule.whatChanged(context), whyItMatters: rule.whyItMatters(context), recommendedNextStep: rule.recommendedNextStep(context), confidence: rule.confidence, magnitude: rule.comparisonType === "latestValue" ? Math.abs(compareValue - rule.threshold) / Math.max(Math.abs(rule.threshold), 1e-6) : Math.abs(compareValue), evidenceMetricIds, date: asOfDate });
    }
  }
  return findings;
}

export const PRODUCTION_RULES: ThresholdRule[] = [
  { id: "cpa-drift", domain: "marketing", metricKey: "cpa", entityType: "campaign", comparisonType: "windowTrend", windowDays: 7, operator: "gt", threshold: 0.25, severity: "warning", confidence: 0.85, title: (ctx) => `CPA rising for ${ctx.entityId}`, whatChanged: (ctx) => `CPA moved from $${ctx.startAverage?.toFixed(2)} to $${ctx.endAverage?.toFixed(2)}, a ${((ctx.percentChange ?? 0) * 100).toFixed(1)}% increase over the trailing window.`, whyItMatters: () => "Rising cost-per-acquisition erodes paid marketing efficiency and margin if left unaddressed.", recommendedNextStep: (ctx) => `Review creative freshness and audience saturation for ${ctx.entityId}.` },
  { id: "stockout-risk", domain: "inventory", metricKey: "days_of_inventory", entityType: "sku", comparisonType: "latestValue", operator: "lt", threshold: 7, severity: "critical", confidence: 0.9, title: (ctx) => `Stockout risk for ${ctx.entityId}`, whatChanged: (ctx) => `${ctx.entityId} has ${ctx.value.toFixed(1)} days of inventory remaining, below the 7-day risk threshold.`, whyItMatters: () => "A top-selling SKU running out of stock directly caps near-term revenue.", recommendedNextStep: (ctx) => `Expedite replenishment for ${ctx.entityId}.` },
  { id: "refund-rate-spike", domain: "commerce", metricKey: "refund_rate", entityType: "sku", comparisonType: "windowTrend", windowDays: 10, operator: "gt", threshold: 1.0, severity: "warning", confidence: 0.85, title: (ctx) => `Refund rate rising for ${ctx.entityId}`, whatChanged: (ctx) => `Refund rate for ${ctx.entityId} moved from ${((ctx.startAverage ?? 0) * 100).toFixed(1)}% to ${((ctx.endAverage ?? 0) * 100).toFixed(1)}%.`, whyItMatters: () => "A refund-rate increase isolated to one SKU often signals a product-quality issue specific to that item.", recommendedNextStep: (ctx) => `Investigate recent quality or fulfillment changes for ${ctx.entityId}.` },
  { id: "shipping-tickets-spike", domain: "support", metricKey: "ticket_count", entityType: "contact_reason", comparisonType: "windowTrend", windowDays: 10, operator: "gt", threshold: 0.5, severity: "warning", confidence: 0.85, title: (ctx) => `Support tickets rising for ${ctx.entityId}`, whatChanged: (ctx) => `${ctx.entityId} ticket volume moved from ${ctx.startAverage?.toFixed(1)}/day to ${ctx.endAverage?.toFixed(1)}/day.`, whyItMatters: () => "A spike in a specific contact reason often points to an operational issue worth investigating before it affects more customers.", recommendedNextStep: () => "Review recent fulfillment and shipping performance." },
  { id: "flow-revenue-growth", domain: "email", metricKey: "flow_revenue", entityType: "flow", comparisonType: "windowTrend", windowDays: 7, operator: "gt", threshold: 0.3, severity: "opportunity", confidence: 0.85, title: (ctx) => `${ctx.entityId} flow revenue performing well`, whatChanged: (ctx) => `${ctx.entityId} revenue moved from $${ctx.startAverage?.toFixed(2)}/day to $${ctx.endAverage?.toFixed(2)}/day, up ${((ctx.percentChange ?? 0) * 100).toFixed(1)}%.`, whyItMatters: () => "Strong lifecycle email performance is a reliable, low-cost revenue channel that can offset softer paid acquisition.", recommendedNextStep: (ctx) => `Consider increasing investment in the ${ctx.entityId} flow.` },
  { id: "underinvested-high-roas-campaign", domain: "marketing", metricKey: "roas", entityType: "campaign", comparisonType: "latestValue", operator: "gt", threshold: 5.5, severity: "opportunity", confidence: 0.8, title: (ctx) => `${ctx.entityId} may be underinvested`, whatChanged: (ctx) => `${ctx.entityId} is returning ${ctx.value.toFixed(1)}x ROAS, well above typical account performance.`, whyItMatters: () => "A campaign this efficient is a strong candidate for additional budget allocation.", recommendedNextStep: (ctx) => `Evaluate increasing spend on ${ctx.entityId}.` },
];
