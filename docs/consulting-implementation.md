# Consulting Implementation Guide

This guide describes how the MVP architecture can become a real operating system component for a DTC client. The implementation remains intentionally staged: earn trust with useful, reconciled decisions before expanding source coverage or automation.

## Discovery
Start with founder, finance, growth, operations, CX, and inventory stakeholders to map the current morning-reporting routine: who combines which dashboards, what it costs in hours, where numbers disagree, and which decisions arrive too late. For a Shopify DTC brand, document the acquisition funnel, merchandising calendar, fulfillment constraints, return reasons, and the last several material incidents—for example, a campaign efficiency decline, a bestseller stockout, or a shipping-delay ticket spike. Turn these examples into a ranked decision backlog and an agreed definition of what must appear in a two-minute executive brief.

## Data access
Inventory the client's actual systems and authorize the narrowest practical API scopes for Shopify, Meta Ads, Google Ads, Klaviyo, Gorgias, GA4, and the inventory or fulfillment platform. Replace each mock with a real adapter behind the unchanged `DataProvider` interface, holding OAuth tokens/API keys in a managed secrets system and retaining only a secure `credentials_ref` in application data. Establish source owners, refresh cadences, historical lookback availability, attribution limitations, and a reconciliation plan before treating a provider as production-ready.

## KPI definition
Run a KPI workshop that converts the brand's operating goals into a metric dictionary: net sales, conversion rate, contribution-aware acquisition efficiency, CAC/CPA, returning-customer mix, refund rate by SKU, support backlog/contact reasons, and days of inventory by priority SKU. Define who owns each KPI, its source of truth, materiality threshold, comparison baseline, and preferred action when it moves. The demo thresholds are illustrative; a $3M brand's tolerable daily swing, stock cover, and paid-media volatility may differ substantially from a $50M brand's, so targets and rule thresholds must be client-specific.

## Implementation
Begin with the one or two highest-value, most reliable sources—usually Shopify and paid media—then validate normalized metrics and early findings with the people who use them. Add Klaviyo, support, and inventory only after the first data path is trustworthy, preserving the normalized metric contract so downstream intelligence remains stable. Configure the deployment database, secrets, source sync cadence, org/user access model, error logging, and a scheduler that invokes the brief-generation endpoint or script on a fixed schedule rather than adding a daemon.

## Validation
Operate in shadow mode alongside the client's existing reporting for an agreed period, commonly two to four weeks. Reconcile sales, order counts, spend, attributed revenue, refunds, and inventory snapshots against source dashboards; investigate timezone, attribution-window, delayed-data, and SKU-identity differences rather than hiding them. Review each critical/warning finding with accountable operators, log false positives, false negatives, and useful early detections, and do not position the brief as a source of truth until the agreed reconciliation and acceptance criteria are met.

## Adoption
Design the delivery around the founder's actual morning routine: delivery time, email or Slack destination, escalation path, and the small set of leaders who need the same context. In a short enablement session, show how to distinguish verified facts, calculated findings, hypotheses, and recommended investigations; demonstrate evidence links and the print view for meeting use. Establish a feedback loop where growth, CX, and operations owners acknowledge actions or annotate irrelevant alerts so the brief becomes a decision ritual rather than another passive dashboard.

## Optimization
Review alert quality, threshold fit, coverage gaps, and usage monthly or after notable business events such as a promotion, new-product launch, carrier disruption, or channel mix change. Tune thresholds by seasonality and margin profile, improve cross-domain checks where a validated causal relationship exists, and retire noisy alerts. Once the core brief has a trusted record, expand to additional providers, more granular profitability or fulfillment metrics, real delivery integrations, and scalable infrastructure only where observed client value justifies it.

## ROI framing for a real engagement
Use [the ROI model](roi-model.md) as a discussion worksheet, not a promise. Replace illustrative reporting-hour, detection-speed, stockout, and paid-spend assumptions with the client's measured values; document sources and avoid double-counting overlapping exposure categories.
