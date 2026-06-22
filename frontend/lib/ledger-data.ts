import type { AgentId, Expense, LedgerAgent, ReportTemplate } from "@/lib/ledger-types";

export const ledgerAgents: LedgerAgent[] = [
  {
    id: "receipt-agent",
    name: "Receipt Agent",
    terminalName: "z:ledger:receipt-agent",
    description: "Extracts receipt metadata and writes normalized expense records.",
    permissions: ["Read uploads", "Extract merchant/amount/date", "Create expense drafts"],
    denied: ["Payment execution", "Report publishing"],
    status: "active",
    contractFunction: "scan-receipt",
    risk: "low",
  },
  {
    id: "category-agent",
    name: "Category Agent",
    terminalName: "z:ledger:category-agent",
    description: "Classifies expenses and flags unusual category shifts.",
    permissions: ["Read expenses", "Update categories", "Flag anomalies"],
    denied: ["Delete expenses", "Payment execution"],
    status: "watching",
    contractFunction: "classify-expense",
    risk: "medium",
  },
  {
    id: "report-agent",
    name: "Report Agent",
    terminalName: "z:ledger:report-agent",
    description: "Generates monthly, weekly, tax, CSV, and JSON reports.",
    permissions: ["Read expense ledger", "Generate exports", "Create summaries"],
    denied: ["Modify expenses", "Payment execution"],
    status: "active",
    contractFunction: "generate-report",
    risk: "medium",
  },
  {
    id: "payment-agent",
    name: "Payment Agent",
    terminalName: "z:ledger:payment-agent",
    description: "Prepares bill payment intents and waits for human approval.",
    permissions: ["Create payment intents", "Verify vendor policy", "Execute approved payments"],
    denied: ["Bypass approvals", "Read raw payment credentials"],
    status: "approval_required",
    contractFunction: "execute-approved-payment",
    risk: "high",
  },
];

export const sampleExpenses: Expense[] = [
  {
    id: "exp_aws_2026_06",
    merchant: "AWS",
    amount: 500,
    currency: "USD",
    date: "2026-06-02",
    category: "Software",
    source: "seed",
    taxDeductible: true,
    confidence: 0.98,
    notes: "Cloud hosting bill. Deductible as business infrastructure.",
  },
  {
    id: "exp_canva_2026_06",
    merchant: "Canva",
    amount: 39,
    currency: "USD",
    date: "2026-06-04",
    category: "Software",
    source: "seed",
    taxDeductible: true,
    confidence: 0.95,
  },
  {
    id: "exp_uber_2026_06",
    merchant: "Uber",
    amount: 84,
    currency: "USD",
    date: "2026-06-07",
    category: "Travel",
    source: "seed",
    taxDeductible: true,
    confidence: 0.91,
  },
  {
    id: "exp_zomato_2026_06",
    merchant: "Zomato",
    amount: 52,
    currency: "USD",
    date: "2026-06-09",
    category: "Food",
    source: "seed",
    taxDeductible: false,
    confidence: 0.9,
  },
  {
    id: "exp_vercel_2026_06",
    merchant: "Vercel",
    amount: 120,
    currency: "USD",
    date: "2026-06-12",
    category: "Software",
    source: "seed",
    taxDeductible: true,
    confidence: 0.96,
  },
  {
    id: "exp_internet_2026_06",
    merchant: "Airtel Business",
    amount: 74,
    currency: "USD",
    date: "2026-06-15",
    category: "Utilities",
    source: "seed",
    taxDeductible: true,
    confidence: 0.92,
  },
  {
    id: "exp_amazon_2026_06",
    merchant: "Amazon",
    amount: 120,
    currency: "USD",
    date: "2026-06-16",
    category: "Shopping",
    source: "seed",
    taxDeductible: false,
    confidence: 0.89,
  },
];

export const reportTemplates: ReportTemplate[] = [
  {
    id: "monthly",
    title: "Monthly Spend Report",
    cadence: "Every month",
    owner: "report-agent",
    description: "Category totals, daily trend, largest vendors, and budget drift.",
    outputs: ["PDF-ready summary", "CSV export", "JSON ledger"],
  },
  {
    id: "tax",
    title: "Tax Deductibility Report",
    cadence: "Quarterly",
    owner: "report-agent",
    description: "Separates deductible and non-deductible expenses with evidence notes.",
    outputs: ["Deduction table", "Receipt trace", "Accountant notes"],
  },
  {
    id: "payment",
    title: "Pending Payment Dossier",
    cadence: "On demand",
    owner: "payment-agent",
    description: "Vendor policy check, amount verification, and approval record.",
    outputs: ["Approval packet", "Terminal3 proof", "Audit row"],
  },
];

export function agentById(id: AgentId) {
  return ledgerAgents.find((agent) => agent.id === id) ?? ledgerAgents[0];
}

export function totalSpend(expenses: Expense[]) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function spendByCategory(expenses: Expense[]) {
  return Object.values(
    expenses.reduce<Record<string, { category: string; amount: number; count: number }>>((acc, expense) => {
      acc[expense.category] ??= { category: expense.category, amount: 0, count: 0 };
      acc[expense.category].amount += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.amount - a.amount);
}

export function agentLabel(id: AgentId) {
  return agentById(id).name;
}
