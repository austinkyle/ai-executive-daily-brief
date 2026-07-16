Project: DTC Executive Daily Brief

You are acting as a principal software architect, senior full-stack engineer, AI systems engineer, and ecommerce operations consultant.

Your job is to plan and build a production-minded MVP of an Executive Daily Brief for direct-to-consumer ecommerce brands.

Do not begin coding immediately.

First inspect the repository, understand the requirements below, identify ambiguities, and produce a detailed implementation plan. After the plan is complete, begin implementation in logical phases unless a genuine blocker requires user input.


Strategic Context

This project is part of a broader portfolio positioning me as an:

AI Systems Architect for DTC Brands

The long-term vision is to build an AI-native consulting firm that helps founder-led ecommerce companies redesign their operations using AI, automation, data integration, and intelligent business systems.

The project is not intended to be a generic AI dashboard or another shallow ecommerce reporting application.

It should demonstrate the ability to:


Understand how a DTC business operates.
Integrate fragmented business systems.
Transform raw business data into decision-ready intelligence.
Identify anomalies, risks, and opportunities.
Reduce the time founders spend assembling reports.
Improve executive visibility and decision-making.
Build reusable components that can eventually become part of a larger AI Operating System.


Business outcomes come before technology.

AI is the implementation mechanism, not the product.

Prefer long-term leverage, reusable architecture, and clear business value over unnecessary technical complexity.


Core Product Concept

Every morning, the system should collect the most important information from a DTC brand's business systems and generate a concise executive briefing.

The founder should be able to understand in approximately two minutes:


What happened yesterday?
Why did it happen?
What requires attention?
What opportunities exist?
What actions should be considered today?


The system should behave more like an AI chief of staff or business analyst than a dashboard that merely repeats metrics.


Target User

The primary user is the founder or executive team of a Shopify-based DTC brand generating approximately $3 million to $50 million in annual revenue.

These companies typically use systems such as:


Shopify
Meta Ads
Google Ads
Klaviyo
Google Analytics 4
Gorgias or Zendesk
Inventory or fulfillment platforms
Slack
Email
Accounting software


The MVP does not need to integrate every platform, but its architecture should allow additional data sources to be added cleanly.


MVP Objective

Create a portfolio-quality working application that demonstrates the entire intelligence loop:

Business data
→ normalized metrics
→ comparisons and anomaly detection
→ AI interpretation
→ executive brief
→ delivery and historical storage

The MVP should be usable without real client credentials.

It must include a realistic seeded demo company and simulated DTC data so the complete experience can be demonstrated immediately.


Recommended MVP Scope

The initial MVP should support these data domains:

1. Commerce

Model Shopify-style data including:


Gross sales
Net sales
Orders
Units sold
Average order value
Discounts
Refunds
New versus returning customers
Top products
Product-level sales changes


2. Paid Marketing

Model Meta Ads and Google Ads-style data including:


Spend
Revenue attributed
ROAS
MER or blended efficiency
CPA
CAC
CTR
CPM
Conversion rate
Campaign-level performance
Material day-over-day changes


3. Email and Lifecycle Marketing

Model Klaviyo-style data including:


Campaign revenue
Flow revenue
Sends
Open rate
Click rate
Conversion rate
Unsubscribes
Deliverability warnings


4. Customer Support

Model Gorgias-style data including:


Tickets created
Tickets resolved
Backlog
First response time
Resolution time
Common contact reasons
Negative sentiment trends
Product-related issue trends


5. Inventory

Model inventory data including:


Units on hand
Days of inventory remaining
Sell-through velocity
Potential stockouts
Excess inventory
Products requiring attention


The underlying architecture should use provider adapters so simulated data can later be replaced by real API integrations.


Core User Experience

Build a clean executive application with the following views.

A. Today's Brief

Display:


Executive summary
Overall business status
Key wins
Key risks
Important anomalies
Recommended actions
Supporting metrics
Source attribution or evidence for important claims


The brief should prioritize information rather than giving equal weight to every metric.

B. Business Scorecard

Display key metrics across:


Revenue
Marketing
Customer
Support
Inventory


Include comparisons against:


Previous day
Same weekday from the previous week
Trailing seven-day average
Month-to-date target when applicable


C. Alerts and Opportunities

Categorize findings by:


Critical
Warning
Opportunity
Informational


Each finding should include:


What changed
Why it matters
Supporting data
Confidence level
Recommended next step


D. Historical Briefs

Allow the user to review previously generated daily briefs and understand trends over time.

E. Data Sources

Show connected or simulated systems, sync status, last successful update, and errors.


Intelligence Requirements

Do not send raw data directly to an LLM and ask it to discover everything.

Use deterministic analytics first.

The system should calculate:


Day-over-day changes
Week-over-week comparisons
Same-weekday comparisons
Rolling averages
Target variance
Contribution changes
Threshold-based alerts
Basic anomaly scores
Cross-domain relationships where evidence supports them


Examples:


Revenue declined while traffic remained stable, suggesting a conversion issue.
Spend increased faster than attributed revenue.
A top-selling product is approaching a stockout.
Refunds rose following increased sales of a specific SKU.
Support tickets about shipping increased materially.
Returning-customer revenue weakened.
Email flow revenue offset weaker paid acquisition.
One campaign generated most of the decline in marketing efficiency.


The LLM should receive structured findings and supporting evidence, then turn them into an executive-quality narrative.

The LLM must not invent explanations unsupported by the data.

Clearly distinguish:


Verified facts
Calculated findings
Plausible hypotheses
Recommended investigations



Brief Output Structure

Generate the daily brief in this approximate structure:

Executive Summary

Three to five sentences explaining overall business performance.

What Went Well

The most meaningful positive developments.

What Needs Attention

The highest-priority risks, anomalies, or deteriorating metrics.

Recommended Actions

Three to five concrete actions ranked by urgency and expected business impact.

Key Numbers

A compact scorecard of the most important metrics.

Supporting Evidence

References to the metrics, comparisons, and data sources behind significant claims.

The system should avoid generic commentary such as "continue monitoring performance."

Recommendations should be specific enough for an executive to act on.


Demo Scenario

Create a seeded fictional DTC company with enough historical data to produce meaningful findings.

The demo company should resemble a growing Shopify brand and include at least 30 days of realistic daily data.

Create several intentional business conditions that the intelligence engine should detect, such as:


Revenue down despite steady traffic.
Meta CPA increasing.
One campaign deteriorating sharply.
A top product approaching a stockout.
Refunds rising for a particular product.
Support complaints increasing around shipping.
Klaviyo flow revenue performing strongly.
Returning-customer revenue improving or weakening.
A meaningful opportunity involving a high-performing product or channel.


Do not make the data random noise. Build coherent causal patterns that make the generated brief convincing.

Seed data generation should be deterministic or reproducible.


Architecture Principles

Use a modular architecture that separates:


Data-source adapters
Raw ingestion
Data normalization
Metric computation
Rules and anomaly detection
Structured insight generation
LLM narrative generation
Brief storage
Delivery channels
User interface


Create clear interfaces for data providers so future integrations can implement a common contract.

Suggested conceptual structure:

apps/
  web/
  worker-or-api/

packages/
  database/
  domain/
  integrations/
  analytics/
  intelligence/
  ai/
  notifications/
  shared/

You may adjust the repository structure if a simpler architecture better fits the selected stack.

Do not introduce microservices unless there is a strong reason. A modular monolith is preferred for the MVP.


Technical Direction

Select a modern, maintainable stack suitable for a portfolio project and later client implementation.

A reasonable default is:


Next.js with TypeScript
React
Tailwind CSS
PostgreSQL
Prisma or Drizzle ORM
Background jobs or scheduled tasks
OpenAI-compatible LLM interface
Zod for runtime validation
Docker for local infrastructure
Vitest or an equivalent test framework


You may recommend changes, but explain the reasoning before making them.

Requirements:


Strict TypeScript
Environment-variable validation
Clear error handling
Structured logging
Database migrations
Seed scripts
Reusable provider interfaces
Responsive UI
Accessible core interactions
No hardcoded secrets
A mock or deterministic AI mode when no API key is present
Easy local setup


Avoid adding infrastructure that does not improve the MVP.

NOTE (user constraint override): Prioritize a light local footprint — SQLite instead of Postgres, no Docker, single app process. Keep the schema Postgres-portable and document the swap path. See CLAUDE.md Resource Budget; CLAUDE.md wins on any conflict with this section.


AI Architecture

Create an abstraction around the LLM provider rather than coupling business logic directly to one model.

The AI generation pipeline should:


Receive structured metrics and findings.
Validate the input schema.
Use a clearly defined system prompt.
Produce structured output.
Validate the response.
Retry or fail gracefully when validation fails.
Store the prompt version and generation metadata.
Support a non-LLM fallback for demonstrations and tests.


The structured result should include fields such as:


Overall status
Executive summary
Wins
Risks
Opportunities
Recommended actions
Evidence references
Confidence


Do not permit the model to create unsupported financial claims.


Scheduling and Delivery

The MVP should support generating a brief on demand.

Design the system so it can later generate briefs on a daily schedule.

Implement at least one delivery mechanism if practical:


Email
Slack webhook
Downloadable or printable view


For the portfolio demo, simulated delivery is acceptable as long as the architecture is clear and the full flow can be demonstrated.


Security and Multi-Tenancy

This is initially a single-demo-company MVP, but design the data model around organizations.

Include concepts for:


Users
Organizations
Memberships
Data connections
Permissions
Briefs
Findings
Metrics
Sync runs


Do not overbuild enterprise authorization, but avoid data models that make multi-tenancy impossible later.

Sensitive credentials should be encrypted or represented through a secure abstraction, even if the MVP only uses simulated providers.


Required Documentation

Create portfolio-quality documentation.

The root README should include:


Product overview
Business problem
Target customer
Business value
Key features
Screenshots or placeholders
Architecture overview
Data flow
Tech stack
Local setup
Environment variables
Demo instructions
Testing instructions
Current limitations
Future integrations
Roadmap
ROI framework


Also create:

docs/
  product-requirements.md
  architecture.md
  data-model.md
  intelligence-engine.md
  ai-safety-and-grounding.md
  demo-scenario.md
  implementation-roadmap.md
  consulting-implementation.md

The consulting implementation document should explain how this system could be deployed for a real DTC client, including discovery, data access, KPI definition, implementation, validation, adoption, and optimization.


ROI Framework

Include a simple way to communicate business value.

The application or documentation should estimate value from:


Executive reporting hours saved
Analyst or operations hours saved
Faster detection of revenue problems
Reduced stockout exposure
Reduced wasted ad spend
Improved decision speed


Do not claim guaranteed revenue results.

Create an editable assumptions-based ROI model that can later be adapted to a client.


Testing Requirements

Add tests for the most important business logic, especially:


Metric comparisons
Rolling averages
Threshold evaluation
Anomaly detection
Insight prioritization
Schema validation
Prevention of unsupported AI evidence references
Seeded demo scenario outputs


The tests should confirm that intentional demo conditions are detected correctly.

Do not focus exclusively on UI snapshot tests.


Definition of Done

The MVP is complete when:


It runs locally with documented setup.
A seeded demo company can be created.
At least 30 days of coherent DTC data are available.
The system calculates normalized metrics.
The intelligence engine detects meaningful conditions.
A daily executive brief can be generated.
The brief contains grounded evidence.
Today's brief is displayed in a polished UI.
Historical briefs can be viewed.
Data-source status is visible.
The system works without real third-party credentials.
Core business logic has meaningful tests.
The repository has portfolio-quality documentation.
The architecture supports replacing mock providers with real integrations.



Execution Process

Follow this sequence.

Phase 1: Repository Assessment and Product Plan

Before writing application code:


Inspect the repository.
Identify existing files, conventions, and constraints.
Restate the product objective.
Define the MVP boundary.
Recommend the stack.
Propose the architecture.
Define the core data model.
Define the analytics and intelligence pipeline.
Identify implementation risks.
Produce a phased task list with acceptance criteria.


Write the plan to:

docs/implementation-roadmap.md

Also summarize it in the terminal response.

Phase 2: Foundation

Implement:


Project structure
Configuration
Environment validation
Database
Core domain models
Seed infrastructure
Shared types
Testing foundation


Phase 3: Data and Analytics

Implement:


Provider contracts
Mock data providers
Normalized metrics
Comparison engine
Rule engine
Anomaly detection
Finding prioritization


Phase 4: AI Brief Generation

Implement:


LLM abstraction
Prompt templates
Structured generation
Validation
Evidence grounding
Deterministic fallback mode
Brief persistence


Phase 5: Product Interface

Implement:


Today's Brief
Scorecard
Alerts and opportunities
Historical briefs
Data-source status
Settings needed for the demo


Phase 6: Delivery, Testing, and Documentation

Implement:


On-demand generation
Delivery simulation or one real channel
Tests
Demo script
README
Architecture documentation
Final review


At the end of each phase:


Run relevant tests.
Run type checking.
Run linting.
Resolve failures before moving forward.
Update the implementation roadmap.
Commit changes logically if Git is available.



Decision Rules

When making implementation decisions:


Prefer the simplest architecture that remains extensible.
Do not build features merely because they are technically impressive.
Do not hide unfinished behavior behind polished UI.
Do not use fake AI claims without traceable evidence.
Do not add real integrations before the mock end-to-end experience works.
Do not turn the MVP into a full SaaS platform.
Document meaningful tradeoffs.
Keep the system understandable to future engineers.
Optimize for a compelling client demo and reusable consulting IP.



Initial Response Required

Before changing code, respond with:


Your understanding of the product.
The precise MVP scope.
The proposed stack.
The proposed architecture.
The core entities and data model.
The intelligence and AI pipeline.
The demo-data strategy.
The implementation phases.
The major risks and tradeoffs.
Any assumptions you will make.


Then create the planning documentation and proceed with Phase 1.

Do not ask broad or unnecessary questions. Make reasonable assumptions, document them, and move forward unless a missing answer genuinely prevents implementation.
