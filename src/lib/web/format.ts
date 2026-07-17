export const DOMAIN_LABELS: Record<string, string> = {
  commerce: "Revenue",
  marketing: "Marketing",
  email: "Customer",
  support: "Support",
  inventory: "Inventory",
};

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function formatNumber(value: number): string { return numberFormatter.format(value); }
export function formatCurrency(value: number): string { return currencyFormatter.format(value); }
export function formatPercent(value: number): string { return percentFormatter.format(value); }
export function formatDelta(value: number | null, unit: "currency" | "percent" | "number" = "number"): string {
  if (value === null) return "—";
  const format = unit === "currency" ? formatCurrency : unit === "percent" ? formatPercent : formatNumber;
  return `${value > 0 ? "+" : value < 0 ? "-" : "±"}${format(Math.abs(value))}`;
}
export function formatDate(isoDate: string): string { return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`)); }

export function humanizeMetricKey(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function guessUnitForMetricKey(key: string): "currency" | "percent" | "number" {
  const lower = key.toLowerCase();
  if (["sales", "revenue", "spend", "aov", "value", "cost", "refund"].some((token) => lower.includes(token))) {
    return "currency";
  }
  if (["rate", "ctr", "cvr", "margin", "percent"].some((token) => lower.includes(token))) {
    return "percent";
  }
  return "number";
}
