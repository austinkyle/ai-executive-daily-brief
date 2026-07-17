const METRIC_LABELS: Record<string, string> = {
  sessions: "site sessions",
  orders: "orders",
  conversion_rate: "conversion rate",
  gross_sales: "gross sales",
  aov: "average order value",
  new_customer_revenue: "new-customer revenue",
  returning_customer_revenue: "returning-customer revenue",
  units_sold: "units sold",
  refund_rate: "refund rate",
  refunds_amount: "refund amount",
  spend: "ad spend",
  attributed_revenue: "attributed revenue",
  roas: "ROAS",
  cpa: "CPA",
  ctr: "CTR",
  units_on_hand: "units on hand",
  days_of_inventory: "days of inventory",
  flow_revenue: "flow revenue",
  open_rate: "open rate",
  click_rate: "click rate",
  ticket_count: "ticket volume",
};

const ENTITY_LABELS: Record<string, string> = {
  org: "storewide",
  abandoned_cart: "the abandoned-cart flow",
  welcome_series: "the welcome-series flow",
  shipping_delay: "shipping delays",
  product_question: "product questions",
  other: "other reasons",
};

export function metricLabel(metricKey: string): string {
  return METRIC_LABELS[metricKey] ?? metricKey.replaceAll("_", " ");
}

export function entityLabel(entityId: string): string {
  return ENTITY_LABELS[entityId] ?? entityId;
}

/** "gross sales storewide" / "CPA for meta-prospecting-bestseller" */
export function metricPhrase(metricKey: string, entityId: string): string {
  if (entityId === "org") return `${metricLabel(metricKey)} storewide`;
  return `${metricLabel(metricKey)} for ${entityLabel(entityId)}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
