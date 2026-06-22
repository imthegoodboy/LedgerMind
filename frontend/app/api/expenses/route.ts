import { NextResponse } from "next/server";
import { insertExpense, listExpenses } from "@/lib/server/db";
import type { Expense } from "@/lib/ledger-types";
import { requireApiAccess } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guarded = await requireApiAccess(request, { key: "expenses-read", limit: 80, mutating: false });
  if (guarded) return guarded;
  return NextResponse.json({ expenses: await listExpenses() });
}

export async function POST(request: Request) {
  const guarded = await requireApiAccess(request, { key: "expenses-write", limit: 30, mutating: true });
  if (guarded) return guarded;

  const body = (await request.json()) as Partial<Expense>;
  if (!body.merchant || typeof body.amount !== "number") {
    return NextResponse.json({ error: "merchant and amount are required" }, { status: 400 });
  }

  const expense: Expense = {
    id: body.id ?? `exp_${crypto.randomUUID()}`,
    merchant: body.merchant,
    amount: body.amount,
    currency: body.currency === "INR" ? "INR" : "USD",
    date: body.date ?? new Date().toISOString().slice(0, 10),
    category: body.category ?? "Uncategorized",
    source: body.source ?? "manual",
    taxDeductible: Boolean(body.taxDeductible),
    confidence: body.confidence ?? 0.82,
    notes: body.notes,
  };

  return NextResponse.json({ expense: await insertExpense(expense) });
}
