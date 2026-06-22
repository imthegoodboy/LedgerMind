"use client";

import { FormEvent, useState } from "react";
import { Loader2, ReceiptText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Terminal3ProofStrip } from "@/components/app/terminal3-proof";
import type { AuditLog, Expense } from "@/lib/ledger-types";

export function UploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("AWS invoice 500 USD software subscription");
  const [loading, setLoading] = useState(false);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Select a receipt file first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("receipt", file);
    formData.set("note", note);

    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed");
      setExpense(data.expense);
      setAuditLog(data.auditLog);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Receipt upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section>
        <p className="mb-3 font-mono text-sm text-primary">{"// RECEIPT SCANNER"}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Upload receipts into a verifiable ledger.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          The Receipt Agent extracts merchant, amount, date, category, and tax signals, then writes an auditable action row
          tied to its Terminal3 identity.
        </p>

        <form onSubmit={onSubmit} className="mt-8 rounded-xl border border-border bg-card p-6">
          <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/35 bg-primary/5 p-6 text-center transition-colors hover:bg-primary/10">
            <UploadCloud className="mb-4 h-10 w-10 text-primary" />
            <span className="font-medium">{file ? file.name : "Drop in a PDF, image, or screenshot"}</span>
            <span className="mt-2 text-sm text-muted-foreground">
              Images are parsed with AI OCR; PDFs keep evidence metadata and context.
            </span>
            <input
              type="file"
              className="sr-only"
              accept="image/*,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">Receipt context</label>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24" />
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <Button type="submit" className="mt-5 w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}
            Scan Receipt
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold">Extraction Result</h2>
        {expense ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {[
                ["Merchant", expense.merchant],
                ["Amount", `${expense.currency} ${expense.amount.toFixed(2)}`],
                ["Category", expense.category],
                ["Date", expense.date],
                ["Tax deductible", expense.taxDeductible ? "Yes" : "No"],
                ["Confidence", `${Math.round(expense.confidence * 100)}%`],
                ["Evidence", expense.receiptStorage ?? "metadata-only"],
              ].map(([label, value]) => (
                <div key={label} className="bg-background/70 p-4">
                  <div className="font-mono text-xs text-muted-foreground">{label}</div>
                  <div className="mt-2 font-medium">{value}</div>
                </div>
              ))}
            </div>

            {auditLog && <Terminal3ProofStrip proof={auditLog.terminal3} />}
          </div>
        ) : (
          <div className="mt-8 border-l-2 border-primary/40 pl-5 text-sm leading-7 text-muted-foreground">
            Waiting for an upload. The resulting expense will appear here and on the dashboard immediately after the
            Receipt Agent records its protected action.
          </div>
        )}
      </section>
    </div>
  );
}
