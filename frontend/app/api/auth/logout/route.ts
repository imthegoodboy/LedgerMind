import { NextResponse } from "next/server";
import { clearWorkspaceCookie, requireApiAccess } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guarded = await requireApiAccess(request, { key: "auth-logout", limit: 20, mutating: true });
  if (guarded) return guarded;

  const response = NextResponse.json({ ok: true });
  clearWorkspaceCookie(response);
  return response;
}
