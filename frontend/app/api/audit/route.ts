import { NextResponse } from "next/server";
import { listAuditLogs } from "@/lib/server/db";
import { requireApiAccess } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guarded = await requireApiAccess(request, { key: "audit-read", limit: 80, mutating: false });
  if (guarded) return guarded;
  return NextResponse.json({ auditLogs: await listAuditLogs(100) });
}
