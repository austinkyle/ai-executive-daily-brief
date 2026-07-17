export const STATUS_STYLES: Record<"strong" | "stable" | "mixed" | "at_risk", { text: string; bg: string; label: string }> = {
  strong: { text: "text-green", bg: "bg-green-soft", label: "Strong" },
  stable: { text: "text-blue", bg: "bg-blue-soft", label: "Stable" },
  mixed: { text: "text-amber", bg: "bg-amber-soft", label: "Mixed" },
  at_risk: { text: "text-red", bg: "bg-red-soft", label: "At Risk" },
};

export const SEVERITY_STYLES: Record<"critical" | "warning" | "opportunity" | "info", { text: string; bg: string; label: string }> = {
  critical: { text: "text-red", bg: "bg-red-soft", label: "Critical" },
  warning: { text: "text-amber", bg: "bg-amber-soft", label: "Warning" },
  opportunity: { text: "text-green", bg: "bg-green-soft", label: "Opportunity" },
  info: { text: "text-slate", bg: "bg-slate-soft", label: "Info" },
};
