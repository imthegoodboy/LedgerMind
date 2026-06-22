import { NextResponse } from "next/server";
import { recordProtectedAction } from "@/lib/server/actions";
import type { AgentId, ActionRisk } from "@/lib/ledger-types";
import { requireApiAccess } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedAgents: AgentId[] = ["receipt-agent", "category-agent", "report-agent", "payment-agent"];
const allowedRisks: ActionRisk[] = ["low", "medium", "high"];

export async function POST(request: Request) {
  const guarded = await requireApiAccess(request, { key: "protected-actions", limit: 30, mutating: true });
  if (guarded) return guarded;

  const body = (await request.json()) as {
    agentId?: AgentId;
    action?: string;
    target?: string;
    risk?: ActionRisk;
    requiresApproval?: boolean;
  };

  if (!body.agentId || !allowedAgents.includes(body.agentId)) {
    return NextResponse.json({ error: "valid agentId is required" }, { status: 400 });
  }

  const risk = body.risk && allowedRisks.includes(body.risk) ? body.risk : "medium";
  const auditLog = await recordProtectedAction({
    agentId: body.agentId,
    action: body.action ?? "run protected action",
    target: body.target ?? "LedgerMind workspace",
    risk,
    requiresApproval: body.requiresApproval ?? risk === "high",
    status: risk === "high" ? "pending_approval" : undefined,
    payload: { source: "agent-monitor" },
  });

  return NextResponse.json({ auditLog });
}
