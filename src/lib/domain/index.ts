/** Shared application-domain entities, independent of persistence implementation. */
export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Membership {
  id: string;
  orgId: string;
  userId: string;
  role: string;
}

export interface DataConnection {
  id: string;
  orgId: string;
  providerKey: string;
  displayName: string;
  isSimulated: boolean;
  status: string;
  lastSyncedAt: Date | null;
  credentialsRef: string | null;
}

export interface SyncRun {
  id: string;
  connectionId: string;
  orgId: string;
  runDate: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  error: string | null;
}

export interface Metric {
  id: string;
  orgId: string;
  date: string;
  domain: string;
  metricKey: string;
  entityType: string;
  entityId: string;
  value: number;
  unit: string;
}

export interface Target {
  id: string;
  orgId: string;
  metricKey: string;
  month: string;
  targetValue: number;
}

export interface Finding {
  id: string;
  orgId: string;
  date: string;
  domain: string;
  severity: string;
  title: string;
  whatChanged: string;
  whyItMatters: string;
  confidence: number;
  score: number;
  evidenceMetricRefs: string[];
  recommendedNextStep: string;
}

export interface Brief {
  id: string;
  orgId: string;
  date: string;
  status: string;
  overallStatus: string;
  executiveSummary: string;
  wins: string[];
  risks: string[];
  opportunities: string[];
  recommendedActions: string[];
  keyNumbers: Record<string, number>;
  evidenceFindingRefs: string[];
  confidence: number;
  promptVersion: string;
  model: string;
  isFallback: boolean;
  generatedAt: Date;
}

export interface Delivery {
  id: string;
  briefId: string;
  channel: string;
  status: string;
  sentAt: Date;
}
