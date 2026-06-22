import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

type RateBucket = {
  count: number;
  resetAt: number;
};

const globalForSecurity = globalThis as typeof globalThis & {
  __ledgerMindRateLimits?: Map<string, RateBucket>;
};

const SESSION_COOKIE = "ledgermind_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function rateStore() {
  globalForSecurity.__ledgerMindRateLimits ??= new Map();
  return globalForSecurity.__ledgerMindRateLimits;
}

function secretMaterial() {
  return (
    process.env.LEDGERMIND_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.T3N_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "ledgermind-development-session"
  );
}

function sign(value: string) {
  return crypto.createHmac("sha256", secretMaterial()).update(value).digest("hex");
}

export function workspaceAuthEnabled() {
  return Boolean(process.env.LEDGERMIND_WORKSPACE_CODE?.trim());
}

export function adminAuthEnabled() {
  return Boolean(process.env.LEDGERMIND_ADMIN_TOKEN?.trim());
}

export function createWorkspaceSession() {
  const issuedAt = Date.now();
  const nonce = crypto.randomUUID();
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyWorkspaceSession(value?: string | null) {
  if (!workspaceAuthEnabled()) return true;
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [issuedAtRaw, nonce, signature] = parts;
  const payload = `${issuedAtRaw}.${nonce}`;
  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const issuedAt = Number(issuedAtRaw);
  return Number.isFinite(issuedAt) && Date.now() - issuedAt < SESSION_MAX_AGE_SECONDS * 1000;
}

export function setWorkspaceCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, createWorkspaceSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearWorkspaceCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function requireWorkspacePageAccess(nextPath: string) {
  if (!workspaceAuthEnabled()) return;
  const cookieStore = await cookies();
  if (verifyWorkspaceSession(cookieStore.get(SESSION_COOKIE)?.value)) return;
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}

function clientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function rateLimit(request: Request, key: string, limit = 40, windowMs = 60_000) {
  const ip = clientIp(request);
  const now = Date.now();
  const bucketKey = `${key}:${ip}`;
  const store = rateStore();
  const current = store.get(bucketKey);
  if (!current || current.resetAt < now) {
    store.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return null;
  }
  current.count += 1;
  if (current.count <= limit) return null;
  return NextResponse.json(
    { error: "Too many requests. Please retry shortly.", retryAfterMs: current.resetAt - now },
    { status: 429 },
  );
}

export async function requireApiAccess(
  request: Request,
  options: { key: string; limit?: number; mutating?: boolean; admin?: boolean; anonymous?: boolean } = { key: "api" },
) {
  const limited = rateLimit(request, options.key, options.limit ?? 40);
  if (limited) return limited;

  if (options.mutating !== false && !sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }

  if (options.admin) {
    const configured = process.env.LEDGERMIND_ADMIN_TOKEN?.trim();
    if (!configured) {
      return NextResponse.json({ error: "Admin operations require LEDGERMIND_ADMIN_TOKEN." }, { status: 503 });
    }
    const supplied = request.headers.get("x-ledgermind-admin-token");
    if (!supplied || supplied !== configured) {
      return NextResponse.json({ error: "Admin token is required." }, { status: 401 });
    }
    return null;
  }

  if (options.anonymous) return null;

  if (!workspaceAuthEnabled()) return null;

  const directToken = request.headers.get("x-ledgermind-access-token");
  if (directToken && directToken === process.env.LEDGERMIND_WORKSPACE_CODE) return null;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const session = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  if (verifyWorkspaceSession(session)) return null;
  return NextResponse.json({ error: "Workspace access is required." }, { status: 401 });
}
