export type AgentId = "receipt-agent" | "category-agent" | "report-agent" | "payment-agent";

export type ActionRisk = "low" | "medium" | "high";

export type ActionStatus = "verified" | "pending_approval" | "approved" | "blocked" | "simulated";

export interface LedgerAgent {
  id: AgentId;
  name: string;
  terminalName: string;
  description: string;
  permissions: string[];
  denied: string[];
  status: "active" | "watching" | "approval_required";
  contractFunction: string;
  risk: ActionRisk;
}

export interface Expense {
  id: string;
  merchant: string;
  amount: number;
  currency: "USD" | "INR";
  date: string;
  category: string;
  source: "seed" | "receipt" | "manual" | "agent";
  taxDeductible: boolean;
  confidence: number;
  notes?: string;
  receiptFileName?: string;
  receiptMimeType?: string;
  receiptUrl?: string;
  receiptStorage?: "cloudinary" | "metadata-only";
}

export interface ReportTemplate {
  id: string;
  title: string;
  cadence: string;
  owner: AgentId;
  description: string;
  outputs: string[];
}

export interface ProtectedActionInput {
  agentId: AgentId;
  action: string;
  target: string;
  risk: ActionRisk;
  status?: ActionStatus;
  requiresApproval?: boolean;
  amount?: number;
  currency?: string;
  payload?: Record<string, unknown>;
}

export interface Terminal3Proof {
  mode: "live" | "degraded" | "local";
  environment: string;
  did: string | null;
  agentDid: string;
  nodeUrl: string | null;
  sessionId: string | null;
  scriptName: string;
  functionName: string;
  digest: string;
  signature: string;
  signatureKind: "terminal3-contract" | "local-hmac-fallback";
  contractExecution: "executed" | "not-configured" | "failed" | "skipped";
  contractResult?: unknown;
  contractError?: string;
  auditEventCount?: number;
  sdkSteps: string[];
  error?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  agentId: AgentId;
  action: string;
  target: string;
  risk: ActionRisk;
  status: ActionStatus;
  requiresApproval: boolean;
  terminal3: Terminal3Proof;
  summary: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Terminal3SessionSnapshot {
  configured: boolean;
  mode: "live" | "degraded" | "local";
  environment: string;
  did: string | null;
  configuredDid: string | null;
  address: string | null;
  nodeUrl: string | null;
  sessionId: string | null;
  expiresAt: string | null;
  balance: string | null;
  tenantStatus: string | null;
  sdkCoverage: string[];
  error?: string;
}
