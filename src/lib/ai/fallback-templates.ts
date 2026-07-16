import type { BriefContent, OverallStatus } from "./schema";
import type { FindingForPrompt } from "./types";

function deriveStatus(
  criticalCount: number,
  warningCount: number,
  opportunityCount: number,
): OverallStatus {
  if (criticalCount > 0) return "at_risk";
  if (warningCount > 0 && warningCount >= opportunityCount) return "mixed";
  if (warningCount > 0) return "stable";
  return "strong";
}

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export function buildFallbackContent(findings: FindingForPrompt[]): BriefContent {
  if (findings.length === 0) {
    return {
      overall_status: "strong",
      executive_summary:
        "No significant anomalies or threshold breaches were detected across commerce, marketing, email, support, or inventory today; performance remained within normal ranges.",
      wins: [
        "No metrics breached alert thresholds, indicating stable execution across all tracked channels.",
      ],
      risks: [],
      opportunities: [],
      recommended_actions: [],
      evidence_refs: [],
      confidence: 0.95,
    };
  }

  const sorted = [...findings].sort((left, right) => right.score - left.score);
  const riskFindings = sorted.filter(
    (finding) => finding.severity === "critical" || finding.severity === "warning",
  );
  const opportunityFindings = sorted.filter(
    (finding) => finding.severity === "opportunity",
  );
  const winFindings = sorted.filter(
    (finding) => finding.severity === "opportunity" || finding.severity === "info",
  );
  const actionCandidates = sorted.filter(
    (finding) =>
      finding.severity === "critical" ||
      finding.severity === "warning" ||
      finding.severity === "opportunity",
  );

  const risks = riskFindings.map(
    (finding) => `${finding.whatChanged} ${finding.whyItMatters}`,
  );
  const wins = winFindings.map((finding) => finding.whatChanged);
  const opportunities = opportunityFindings.map(
    (finding) => `${finding.whyItMatters} ${finding.recommendedNextStep}`,
  );

  const actionIds = new Set<string>();
  const actionFindings = actionCandidates
    .filter((finding) => {
      if (actionIds.has(finding.id)) return false;
      actionIds.add(finding.id);
      return true;
    })
    .slice(0, 5);
  const recommended_actions = actionFindings.map((finding) => {
    const prefix =
      finding.severity === "critical"
        ? "Immediately: "
        : finding.severity === "warning"
          ? "This week: "
          : "Consider: ";
    return `${prefix}${finding.recommendedNextStep}`;
  });

  const criticalCount = sorted.filter((finding) => finding.severity === "critical").length;
  const warningCount = sorted.filter((finding) => finding.severity === "warning").length;
  const opportunityCount = opportunityFindings.length;
  const overall_status = deriveStatus(criticalCount, warningCount, opportunityCount);
  const topRisk = riskFindings[0];
  const topOpportunity = opportunityFindings[0];

  const headline =
    overall_status === "at_risk"
      ? `Today's brief flags ${pluralize(criticalCount, "critical issue")} requiring immediate attention.`
      : overall_status === "mixed"
        ? `Performance is mixed today: ${pluralize(warningCount, "warning")} partially offset by ${pluralize(opportunityCount, "positive development")}.`
        : overall_status === "stable"
          ? `The business remains fundamentally stable today, with ${pluralize(warningCount, "manageable warning")} outweighed by ${pluralize(opportunityCount, "positive development")}.`
          : `No critical issues or warnings were identified today, and ${pluralize(opportunityCount, "notable positive development")} stood out.`;

  const summary = [headline];
  if (topRisk) {
    summary.push(
      `The most pressing issue is ${topRisk.title.toLowerCase()}: ${topRisk.whatChanged}`,
    );
  }
  if (topOpportunity) {
    summary.push(`On the positive side, ${topOpportunity.title.toLowerCase()}.`);
  }
  if (topRisk && topOpportunity) {
    summary.push(
      "The net read is that immediate risk containment should proceed while the positive development is converted into durable momentum.",
    );
  } else if (topRisk) {
    summary.push(
      "The net read is that the identified risk warrants focused action before it can materially affect broader performance.",
    );
  } else if (topOpportunity) {
    summary.push(
      "The net read is positive, with a concrete opportunity available to strengthen the current trajectory.",
    );
  } else {
    summary.push("The net read is stable, with the available findings indicating routine operational conditions.");
    summary.push("No priority action is indicated by today's informational findings.");
  }
  if (actionFindings.length > 0) {
    summary.push(`Focus today on: ${actionFindings[0].recommendedNextStep.toLowerCase()}`);
  }

  const citedFindings = new Map<string, FindingForPrompt>();
  [...riskFindings, ...winFindings, ...opportunityFindings, ...actionFindings].forEach(
    (finding) => citedFindings.set(finding.id, finding),
  );
  const cited = [...citedFindings.values()];
  const confidence = Number(
    (cited.reduce((total, finding) => total + finding.confidence, 0) / cited.length).toFixed(2),
  );

  return {
    overall_status,
    executive_summary: summary.join(" "),
    wins,
    risks,
    opportunities,
    recommended_actions,
    evidence_refs: cited.map((finding) => finding.id),
    confidence,
  };
}
