"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { ledgerAgents, spendByCategory, totalSpend } from "@/lib/ledger-data";
import type { AuditLog, Expense, Terminal3SessionSnapshot } from "@/lib/ledger-types";
import { cn } from "@/lib/utils";

const palette = ["#54d6a7", "#79b8ff", "#ffd166", "#f87171", "#c084fc", "#94a3b8"];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function DashboardClient({
  initialExpenses,
  initialAuditLogs,
  terminal3,
}: {
  initialExpenses: Expense[];
  initialAuditLogs: AuditLog[];
  terminal3: Terminal3SessionSnapshot;
}) {
  const [expenses] = useState(initialExpenses);
  const categories = useMemo(() => spendByCategory(expenses), [expenses]);
  const daily = useMemo(
    () =>
      expenses
        .reduce<Record<string, { date: string; amount: number }>>((acc, expense) => {
          acc[expense.date] ??= { date: expense.date.slice(5), amount: 0 };
          acc[expense.date].amount += expense.amount;
          return acc;
        }, {}),
    [expenses],
  );
  const trend = Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));
  const deductible = expenses.filter((expense) => expense.taxDeductible);
  const pending = initialAuditLogs.filter((log) => log.status === "pending_approval").length;

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div>
          <p className="mb-3 font-mono text-sm text-primary">{"// TRUSTED FINANCE AGENT"}</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Verifiable expense operations, not anonymous automation.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            LedgerMind turns receipts, reports, and payment intents into Terminal3-scoped actions with agent identity,
            permission checks, and audit evidence.
          </p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-sm text-primary">
              <ShieldCheck className="h-4 w-4" />
              Terminal3 ADK
            </div>
            <span
              className={cn(
                "rounded-md px-2 py-1 font-mono text-xs",
                terminal3.mode === "live" ? "bg-primary/15 text-primary" : "bg-yellow-500/10 text-yellow-300",
              )}
            >
              {terminal3.mode}
            </span>
          </div>
          <div className="grid gap-3 font-mono text-xs text-muted-foreground">
            <div className="flex justify-between gap-4">
              <span>DID</span>
              <span className="truncate text-foreground">{terminal3.did ?? terminal3.configuredDid ?? "not connected"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Network</span>
              <span className="text-foreground">{terminal3.environment}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Balance</span>
              <span className="text-foreground">{terminal3.balance ?? "pending"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
        {[
          { label: "Tracked spend", value: money(totalSpend(expenses)), sub: `${expenses.length} ledger rows` },
          { label: "Deductible", value: money(totalSpend(deductible)), sub: `${deductible.length} evidence-backed` },
          { label: "Agents", value: String(ledgerAgents.length), sub: "DID-scoped workers" },
          { label: "Approvals", value: String(pending), sub: "waiting on human" },
        ].map((item) => (
          <div key={item.label} className="bg-card p-6">
            <div className="font-mono text-xs text-muted-foreground">{item.label}</div>
            <div className="mt-3 text-3xl font-semibold">{item.value}</div>
            <div className="mt-2 text-sm text-muted-foreground">{item.sub}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Daily Spend</h2>
              <p className="text-sm text-muted-foreground">Receipt and invoice flow across the current month.</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-primary" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="spend" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#54d6a7" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#54d6a7" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,.14)" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,.25)" }} />
                <Area dataKey="amount" stroke="#54d6a7" fill="url(#spend)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold">Category Mix</h2>
          <p className="text-sm text-muted-foreground">Automatically classified by the Category Agent.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-[190px_1fr] lg:grid-cols-1 xl:grid-cols-[190px_1fr]">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="amount" nameKey="category" innerRadius={54} outerRadius={82} paddingAngle={4}>
                    {categories.map((entry, index) => (
                      <Cell key={entry.category} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,.25)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {categories.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette[index % palette.length] }} />
                    <span className="text-sm">{item.category}</span>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">{money(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold">Agent Permission Rail</h2>
          <div className="mt-6 space-y-4">
            {ledgerAgents.map((agent) => (
              <div key={agent.id} className="border-l-2 border-primary/40 pl-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{agent.contractFunction}</div>
                  </div>
                  <span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground">{agent.status}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{agent.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Recent Expenses</h2>
              <p className="text-sm text-muted-foreground">The ledger remains editable through upload and chat actions.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Merchant</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                  <th className="pb-3 text-right font-medium">Tax</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 7).map((expense) => (
                  <tr key={expense.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3">{expense.merchant}</td>
                    <td className="py-3 text-muted-foreground">{expense.category}</td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">{expense.date}</td>
                    <td className="py-3 text-right font-mono">{money(expense.amount)}</td>
                    <td className="py-3 text-right">
                      {expense.taxDeductible ? (
                        <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />
                      ) : (
                        <Clock3 className="ml-auto h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-5 text-2xl font-semibold">Category Agent Throughput</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories}>
              <CartesianGrid stroke="rgba(148,163,184,.14)" vertical={false} />
              <XAxis dataKey="category" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,.25)" }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {categories.map((entry, index) => (
                  <Cell key={entry.category} fill={palette[index % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
