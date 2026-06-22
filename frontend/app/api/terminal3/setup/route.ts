import { NextResponse } from "next/server";
import { prepareTenantMap } from "@/lib/server/terminal3";
import { requireApiAccess } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guarded = await requireApiAccess(request, { key: "terminal3-setup", limit: 5, mutating: true, admin: true });
  if (guarded) return guarded;

  const body = (await request.json()) as { contractId?: number };
  const contractId = body.contractId;
  if (typeof contractId !== "number" || !Number.isInteger(contractId)) {
    return NextResponse.json({ error: "contractId is required to create the secrets map ACL" }, { status: 400 });
  }

  try {
    const result = await prepareTenantMap(contractId);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Terminal3 setup failed" },
      { status: 502 },
    );
  }
}
