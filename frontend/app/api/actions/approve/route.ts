import { NextResponse } from "next/server";
import { recordProtectedAction } from "@/lib/server/actions";
import { getAuditLog, updateAuditLog } from "@/lib/server/db";
import { requireApiAccess } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guarded = await requireApiAccess(request, { key: "approve-actions", limit: 20, mutating: true });
  if (guarded) return guarded;

  const body = (await request.json()) as { auditLogId?: string; approver?: string };
  if (!body.auditLogId) {
    return NextResponse.json({ error: "auditLogId is required" }, { status: 400 });
  }

  const pending = await getAuditLog(body.auditLogId);
  if (!pending) {
    return NextResponse.json({ error: "Pending action was not found" }, { status: 404 });
  }
  if (!pending.requiresApproval || pending.status !== "pending_approval") {
    return NextResponse.json({ error: "Action is not waiting for approval" }, { status: 409 });
  }

  const approvalLog = await recordProtectedAction({
    agentId: pending.agentId,
    action: `approve and execute ${pending.action}`,
    target: pending.target,
    risk: pending.risk,
    requiresApproval: false,
    status: "approved",
    payload: {
      approvedAuditLogId: pending.id,
      approvedDigest: pending.terminal3.digest,
      approver: body.approver ?? "workspace-user",
    },
  });

  const updatedPending = await updateAuditLog({
    ...pending,
    status: "approved",
    summary: `${pending.summary} Approved by ${body.approver ?? "workspace-user"}.`,
  });

  return NextResponse.json({ auditLog: approvalLog, approvedAction: updatedPending });
}
