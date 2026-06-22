import { NextResponse } from "next/server";
import { insertExpense } from "@/lib/server/db";
import { recordProtectedAction } from "@/lib/server/actions";
import { parseReceipt, uploadReceiptEvidence } from "@/lib/server/receipts";
import { requireApiAccess } from "@/lib/server/security";
import type { Expense } from "@/lib/ledger-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"]);

export async function POST(request: Request) {
  const guarded = await requireApiAccess(request, { key: "receipts", limit: 15, mutating: true });
  if (guarded) return guarded;

  const formData = await request.formData();
  const file = formData.get("receipt");
  const note = String(formData.get("note") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "receipt file is required" }, { status: 400 });
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return NextResponse.json({ error: "receipt file must be 8MB or smaller" }, { status: 413 });
  }
  if (file.type && !allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "receipt must be a PDF or supported image" }, { status: 415 });
  }

  const [parsed, receiptUrl] = await Promise.all([
    parseReceipt(file, note),
    uploadReceiptEvidence(file).catch((error) => {
      console.error("Receipt evidence upload failed", error);
      return null;
    }),
  ]);

  const expense: Expense = {
    id: `exp_${crypto.randomUUID()}`,
    merchant: parsed.merchant,
    amount: parsed.amount,
    currency: parsed.currency,
    date: parsed.date,
    category: parsed.category,
    source: "receipt",
    taxDeductible: parsed.taxDeductible,
    confidence: parsed.confidence,
    notes: parsed.notes,
    receiptFileName: file.name,
    receiptMimeType: file.type,
    receiptUrl: receiptUrl ?? undefined,
    receiptStorage: receiptUrl ? "cloudinary" : "metadata-only",
  };

  await insertExpense(expense);
  const auditLog = await recordProtectedAction({
    agentId: "receipt-agent",
    action: "scan receipt and create expense",
    target: expense.merchant,
    risk: "low",
    payload: {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      receiptStorage: expense.receiptStorage,
      receiptUrl: expense.receiptUrl ?? null,
      extractedExpense: expense,
    },
  });

  return NextResponse.json({ expense, auditLog });
}
