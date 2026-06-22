"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Loader2, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ledgerAgents } from "@/lib/ledger-data";
import type { AuditLog, AgentId, Terminal3SessionSnapshot } from "@/lib/ledger-types";
import { Terminal3ProofStrip } from "@/components/app/terminal3-proof";
import { cn } from "@/lib/utils";

export function AgentsClient({ initialTerminal3 }: { initialTerminal3: Terminal3SessionSnapshot }) {
  const [terminal3, setTerminal3] = useState(initialTerminal3);
  const [auditLog, setAuditLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshSession() {
    setLoading("session");
    setError(null);
    try {
      const response = await fetch("/api/terminal3/session?refresh=1");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "SDK refresh failed");
      setTerminal3(data.terminal3);
    } catch (sessionError) {
      setError(sessionError instanceof Error ? sessionError.message : "SDK refresh failed.");
    } finally {
      setLoading(null);
    }
  }

  async function trigger(agentId: AgentId) {
    const agent = ledgerAgents.find((item) => item.id === agentId)!;
    setLoading(agentId);
    setError(null);
    try {
      const response = await fetch("/api/actions/protected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          action: agent.id === "payment-agent" ? "prepare high-risk payment intent" : `run ${agent.contractFunction}`,
          target: agent.id === "payment-agent" ? "AWS bill" : "LedgerMind ledger",
          risk: agent.risk,
          requiresApproval: agent.id === "payment-agent",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Action failed");
      setAuditLog(data.auditLog);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Protected action failed.");
    } finally {
      setLoading(null);
    }
  }

  async function approvePending() {
    if (!auditLog) return;
    setLoading("approval");
    setError(null);
    try {
      const response = await fetch("/api/actions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditLogId: auditLog.id, approver: "agent-monitor" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Approval failed");
      setAuditLog(data.auditLog);
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : "Approval failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.72fr_0.28fr] lg:items-end">
        <div>
          <p className="mb-3 font-mono text-sm text-primary">{"// AGENT MONITOR"}</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Four finance agents, scoped by Terminal3.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Each agent has a bounded permission set and a dedicated contract function. High-risk actions stop at an
            approval state until a human authorizes execution.
          </p>
        </div>
        <Button variant="outline" onClick={refreshSession} disabled={loading === "session"} className="h-12">
          {loading === "session" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh SDK
        </Button>
      </section>

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-[0.7fr_0.3fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {ledgerAgents.map((agent) => (
            <article key={agent.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold">{agent.name}</h2>
                    <p className="font-mono text-xs text-muted-foreground">{agent.terminalName}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-1 font-mono text-xs",
                    agent.status === "approval_required" ? "bg-yellow-500/10 text-yellow-300" : "bg-primary/10 text-primary",
                  )}
                >
                  {agent.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{agent.description}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-mono text-xs text-primary">Allowed</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {agent.permissions.map((permission) => (
                      <li key={permission} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-mono text-xs text-red-300">Denied</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {agent.denied.map((denied) => (
                      <li key={denied} className="flex gap-2">
                        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 text-red-300" />
                        {denied}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button onClick={() => trigger(agent.id)} disabled={loading === agent.id} className="mt-5 w-full">
                {loading === agent.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Trigger Protected Action
              </Button>
            </article>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">SDK Session</h2>
            <div className="mt-4 space-y-3 font-mono text-xs text-muted-foreground">
              <div className="flex justify-between gap-3">
                <span>mode</span>
                <span className="text-foreground">{terminal3.mode}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>network</span>
                <span className="text-foreground">{terminal3.environment}</span>
              </div>
              <div>
                <span>DID</span>
                <div className="mt-1 break-all text-foreground">{terminal3.did ?? terminal3.configuredDid ?? "not connected"}</div>
              </div>
              <div className="flex justify-between gap-3">
                <span>tenant</span>
                <span className="text-foreground">{terminal3.tenantStatus ?? "pending"}</span>
              </div>
            </div>
            {terminal3.error && <p className="mt-4 text-xs leading-5 text-yellow-300">{terminal3.error}</p>}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">SDK Coverage</h2>
            <ul className="mt-4 space-y-2 font-mono text-xs text-muted-foreground">
              {terminal3.sdkCoverage.map((item) => (
                <li key={item} className="border-l border-primary/35 pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      {auditLog && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold">Latest Protected Action</h2>
          <p className="mt-2 text-sm text-muted-foreground">{auditLog.summary}</p>
          <div className="mt-5">
            <Terminal3ProofStrip proof={auditLog.terminal3} />
          </div>
          {auditLog.status === "pending_approval" && (
            <Button onClick={approvePending} disabled={loading === "approval"} className="mt-5">
              {loading === "approval" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Approve and Execute
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
