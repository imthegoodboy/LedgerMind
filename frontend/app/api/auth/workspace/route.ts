import { NextResponse } from "next/server";
import { requireApiAccess, setWorkspaceCookie, workspaceAuthEnabled } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guarded = await requireApiAccess(request, { key: "auth-workspace", limit: 10, mutating: true, anonymous: true });
  if (guarded) return guarded;

  const body = (await request.json()) as { code?: string; nextPath?: string };
  const nextPath = body.nextPath?.startsWith("/") ? body.nextPath : "/dashboard";

  if (workspaceAuthEnabled() && body.code !== process.env.LEDGERMIND_WORKSPACE_CODE) {
    return NextResponse.json({ error: "Invalid workspace code." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, nextPath });
  setWorkspaceCookie(response);
  return response;
}
