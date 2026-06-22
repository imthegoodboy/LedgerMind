"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditLog } from "@/lib/ledger-types";
import { agentLabel } from "@/lib/ledger-data";
import { Terminal3ProofStrip } from "@/components/app/terminal3-proof";

function formatAuditTime(timestamp: string) {
  return `${new Date(timestamp).toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

export function ActivityClient({ initialAuditLogs }: { initialAuditLogs: AuditLog[] }) {
  const [logs, setLogs] = useState(initialAuditLogs);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/audit");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Audit refresh failed");
      setLogs(data.auditLogs ?? []);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Audit refresh failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => void refresh(), 15000);
    return () => clearInterval(interval);
  }, []);

  async function approve(log: AuditLog) {
    setApproving(log.id);
    setError(null);
    try {
      const response = await fetch("/api/actions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditLogId: log.id, approver: "activity-reviewer" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Approval failed");
      setLogs((current) => [data.auditLog, data.approvedAction, ...current.filter((item) => item.id !== log.id)]);
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : "Approval failed.");
    } finally {
      setApproving(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 font-mono text-sm text-primary">{"// ACTIVITY LOGS"}</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Every agent action is visible.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            LedgerMind stores an application audit row for every AI action and includes the Terminal3 proof envelope used
            to verify agent identity and execution scope.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
      </section>

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card">
        {logs.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">
            No audit rows yet. Use chat, upload, reports, or agent monitor to create one.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <article key={log.id} className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <h2 className="font-medium">{log.action}</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{log.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs text-muted-foreground">
                      <span>{agentLabel(log.agentId)}</span>
                      <span>{log.target}</span>
                      <span>{log.risk} risk</span>
                    </div>
                  </div>
                  <div className="text-left font-mono text-xs text-muted-foreground md:text-right">
                    <div>{formatAuditTime(log.timestamp)}</div>
                    <div className="mt-1 text-primary">{log.status}</div>
                    {log.status === "pending_approval" && (
                      <Button
                        size="sm"
                        className="mt-3"
                        disabled={approving === log.id}
                        onClick={() => void approve(log)}
                      >
                        {approving === log.id ? "Approving" : "Approve"}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Terminal3ProofStrip proof={log.terminal3} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
