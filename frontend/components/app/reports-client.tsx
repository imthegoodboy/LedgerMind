"use client";

import { useState } from "react";
import { Download, FileJson, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportTemplates } from "@/lib/ledger-data";
import type { AuditLog } from "@/lib/ledger-types";
import { Terminal3ProofStrip } from "@/components/app/terminal3-proof";
import { cn } from "@/lib/utils";

type ReportResult = {
  id: string;
  type: string;
  createdAt: string;
  totalSpend: number;
  expenseCount: number;
  deductibleTotal: number;
  deductibleMerchants: string[];
  recommendation: string;
  categories: Array<{ category: string; amount: number; count: number }>;
};

export function ReportsClient() {
  const [active, setActive] = useState<"monthly" | "tax" | "business">("monthly");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLog | null>(null);

  async function generateReport() {
    setLoading(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Report failed");
      setReport(data.report);
      setAuditLog(data.auditLog);
    } finally {
      setLoading(false);
    }
  }

  function downloadJson() {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.type}-ledger-report.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    if (!report) return;
    const rows = [
      ["category", "amount", "count"],
      ...report.categories.map((category) => [category.category, String(category.amount), String(category.count)]),
      ["deductible_total", String(report.deductibleTotal), String(report.deductibleMerchants.length)],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.type}-ledger-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    if (!report) return;
    window.print();
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.75fr_0.25fr] lg:items-end">
        <div>
          <p className="mb-3 font-mono text-sm text-primary">{"// REPORTS"}</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Generate finance reports with proof attached.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            The Report Agent reads the ledger, creates exportable summaries, and signs the operation through the Terminal3
            protected-action flow.
          </p>
        </div>
        <Button onClick={generateReport} disabled={loading} className="h-12">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Generate
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {reportTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setActive(template.id === "payment" ? "business" : (template.id as "monthly" | "tax"))}
            className={cn(
              "rounded-xl border p-5 text-left transition-colors",
              active === (template.id === "payment" ? "business" : template.id)
                ? "border-primary/50 bg-primary/10"
                : "border-border bg-card hover:border-primary/35",
            )}
          >
            <div className="font-mono text-xs text-primary">{template.cadence}</div>
            <h2 className="mt-3 text-xl font-semibold">{template.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{template.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {template.outputs.map((output) => (
                <span key={output} className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground">
                  {output}
                </span>
              ))}
            </div>
          </button>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Report Output</h2>
            <p className="text-sm text-muted-foreground">JSON export is generated client-side from the latest report result.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadJson} disabled={!report}>
              <FileJson className="h-4 w-4" />
              JSON
            </Button>
            <Button variant="outline" onClick={downloadCsv} disabled={!report}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={printReport} disabled={!report}>
              <Download className="h-4 w-4" />
              PDF-ready
            </Button>
          </div>
        </div>

        {report ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
              {[
                ["Type", report.type],
                ["Total", `$${report.totalSpend.toFixed(2)}`],
                ["Expenses", String(report.expenseCount)],
                ["Deductible", `$${report.deductibleTotal.toFixed(2)}`],
              ].map(([label, value]) => (
                <div key={label} className="bg-background/70 p-4">
                  <div className="font-mono text-xs text-muted-foreground">{label}</div>
                  <div className="mt-2 text-lg font-semibold">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-medium">Category Breakdown</h3>
                <div className="mt-3 space-y-3">
                  {report.categories.map((category) => (
                    <div key={category.category} className="flex items-center justify-between border-b border-border/50 pb-2">
                      <span className="text-sm text-muted-foreground">{category.category}</span>
                      <span className="font-mono text-sm">${category.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium">Recommendation</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{report.recommendation}</p>
                <div className="mt-5">
                  <h4 className="font-mono text-xs text-primary">Deductible merchants</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{report.deductibleMerchants.join(", ")}</p>
                </div>
              </div>
            </div>

            {auditLog && <Terminal3ProofStrip proof={auditLog.terminal3} />}
          </div>
        ) : (
          <p className="mt-8 border-l-2 border-primary/40 pl-5 text-sm text-muted-foreground">
            Choose a report type and generate it. The Report Agent will write an audit row and return exportable data.
          </p>
        )}
      </section>
    </div>
  );
}
