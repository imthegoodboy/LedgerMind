import { NextResponse } from "next/server";
import { getTerminal3SessionSnapshot } from "@/lib/server/terminal3";
import { requireApiAccess } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guarded = await requireApiAccess(request, { key: "terminal3-session", limit: 30, mutating: false });
  if (guarded) return guarded;

  const url = new URL(request.url);
  const force = url.searchParams.get("refresh") === "1";
  return NextResponse.json({ terminal3: await getTerminal3SessionSnapshot(force) });
}
