import { NextResponse } from "next/server";
import { spendByCategory, totalSpend } from "@/lib/ledger-data";
import { listExpenses } from "@/lib/server/db";
import { recordProtectedAction } from "@/lib/server/actions";
import { requireApiAccess } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guarded = await requireApiAccess(request, { key: "reports", limit: 20, mutating: true });
  if (guarded) return guarded;

  const body = (await request.json()) as { type?: "monthly" | "tax" | "business" };
  const type = body.type ?? "monthly";
  const expenses = await listExpenses();
  const categories = spendByCategory(expenses);
  const deductible = expenses.filter((expense) => expense.taxDeductible);
  const auditLog = await recordProtectedAction({
    agentId: "report-agent",
    action: "generate report",
    target: `${type} report`,
    risk: "medium",
    payload: { type, expenseCount: expenses.length, total: totalSpend(expenses) },
  });

  const report = {
    id: `report_${crypto.randomUUID()}`,
    type,
    createdAt: new Date().toISOString(),
    totalSpend: totalSpend(expenses),
    expenseCount: expenses.length,
    categories,
    deductibleTotal: totalSpend(deductible),
    deductibleMerchants: deductible.map((expense) => expense.merchant),
    recommendation:
      type === "tax"
        ? "Attach receipt evidence for software, hosting, internet, and business travel before filing."
        : "Review Software and Utilities first; they carry the clearest business context and approval trail.",
  };

  return NextResponse.json({ report, auditLog });
}
