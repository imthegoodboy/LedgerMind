import "server-only";

import crypto from "node:crypto";
import type { AuditLog, ProtectedActionInput } from "@/lib/ledger-types";
import { agentById } from "@/lib/ledger-data";
import { insertAuditLog } from "@/lib/server/db";
import { createTerminal3Proof } from "@/lib/server/terminal3";

export async function recordProtectedAction(input: ProtectedActionInput): Promise<AuditLog> {
  const agent = agentById(input.agentId);
  const proof = await createTerminal3Proof(input);
  const status =
    input.status ??
    (input.requiresApproval
      ? "pending_approval"
      : proof.mode === "live" && proof.contractExecution === "executed"
        ? "verified"
        : "simulated");
  const log: AuditLog = {
    id: `log_${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    agentId: input.agentId,
    action: input.action,
    target: input.target,
    risk: input.risk,
    status,
    requiresApproval: Boolean(input.requiresApproval),
    terminal3: proof,
    summary: `${agent.name} ${status.replace("_", " ")} ${input.action} for ${input.target}.`,
  };

  await insertAuditLog(log);
  return log;
}
