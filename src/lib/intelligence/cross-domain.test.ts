import { describe, expect, it } from "vitest";

import { detectConversionIssue, detectRefundSkuIsolation, detectSpendOutpacingRevenue, detectTicketsShippingInventory, evaluateCrossDomainRules } from "./cross-domain";
import type { MetricPoint, MetricSeriesGroup } from "./types";

const dates = Array.from({ length: 20 }, (_, index) => `2026-07-${String(index + 1).padStart(2, "0")}`);
const points = (values: number[], key: string): MetricPoint[] => dates.slice(0, values.length).map((date, index) => ({ id: `${key}-${index}`, date, value: values[index]! }));
const group = (domain: string, metricKey: string, entityType: string, entityId: string, values: number[]): MetricSeriesGroup => ({ domain, metricKey, entityType, entityId, unit: "count", points: points(values, `${metricKey}-${entityId}`) });
const days = (first: number, last: number, count: number) => [...Array(count).fill(first), ...Array(count).fill(last)];

const conversion = (sessionsLast = 2400) => [group("commerce", "sessions", "org", "org-1", days(2400, sessionsLast, 7)), group("commerce", "conversion_rate", "org", "org-1", days(2.6, 2, 7)), group("commerce", "new_customer_revenue", "org", "org-1", days(1000, 700, 7)), group("commerce", "returning_customer_revenue", "org", "org-1", days(800, 840, 7))];
const marketing = (revenueLast = 700) => [group("marketing", "spend", "campaign", "a", days(100, 140, 7)), group("marketing", "spend", "campaign", "b", days(50, 70, 7)), group("marketing", "attributed_revenue", "campaign", "a", days(1000, revenueLast, 7)), group("marketing", "attributed_revenue", "campaign", "b", days(500, 350, 7))];
const refunds = (flatLast = 0.022) => [group("commerce", "refund_rate", "sku", "spike", days(0.01, 0.03, 10)), group("commerce", "refund_rate", "sku", "flat", days(0.02, flatLast, 10))];
const shipping = (inventoryLast = 8) => [group("support", "ticket_count", "contact_reason", "shipping_delay", days(10, 20, 10)), group("inventory", "days_of_inventory", "sku", "sku-a", days(20, inventoryLast, 10))];

describe("cross-domain rules", () => {
  it("detects a conversion issue", () => expect(detectConversionIssue(conversion(), "2026-07-14")?.ruleId).toBe("conversion-issue"));
  it("does not detect conversion issue with falling traffic", () => expect(detectConversionIssue(conversion(1800), "2026-07-14")).toBeNull());
  it("detects spend outpacing revenue", () => expect(detectSpendOutpacingRevenue(marketing(), "2026-07-14")?.ruleId).toBe("spend-outpacing-revenue"));
  it("does not detect spend outpacing revenue when revenue grows", () => expect(detectSpendOutpacingRevenue(marketing(1300), "2026-07-14")).toBeNull());
  it("detects an isolated refund spike", () => expect(detectRefundSkuIsolation(refunds(), "2026-07-20")?.entityId).toBe("spike"));
  it("does not detect isolated spike without flat comparator", () => expect(detectRefundSkuIsolation(refunds(0.05), "2026-07-20")).toBeNull());
  it("detects tickets with low inventory", () => expect(detectTicketsShippingInventory(shipping(), "2026-07-20")?.ruleId).toBe("tickets-shipping-inventory"));
  it("does not detect tickets correlation with healthy inventory", () => expect(detectTicketsShippingInventory(shipping(15), "2026-07-20")).toBeNull());
  it("combines findings from merged fixtures", () => expect(evaluateCrossDomainRules([...conversion(), ...marketing(), ...refunds(), ...shipping()], "2026-07-20")).toHaveLength(4));
});
