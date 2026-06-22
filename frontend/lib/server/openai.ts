import "server-only";

import OpenAI from "openai";
import type { ChatMessage, Expense } from "@/lib/ledger-types";
import { spendByCategory, totalSpend } from "@/lib/ledger-data";

type LedgerMindAnswer = {
  content: string;
  mode: "openai" | "fallback";
  error?: string;
};

function fallbackAnswer(messages: ChatMessage[], expenses: Expense[], error?: string): LedgerMindAnswer {
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? "";
  const total = totalSpend(expenses);
  const categories = spendByCategory(expenses)
    .map((item) => `${item.category}: $${item.amount.toFixed(2)}`)
    .join(", ");

  if (last.includes("tax") || last.includes("deduct")) {
    const deductible = expenses.filter((expense) => expense.taxDeductible);
    return {
      mode: "fallback",
      error,
      content: `I found ${deductible.length} deductible expenses totaling $${totalSpend(deductible).toFixed(2)}. Strong evidence: ${deductible
        .slice(0, 4)
        .map((expense) => expense.merchant)
        .join(", ")}.`,
    };
  }

  if (last.includes("pay") || last.includes("payment")) {
    return {
      mode: "fallback",
      error,
      content:
        "I prepared a payment intent, but the Payment Agent cannot execute it until you approve the high-risk action. The action was written to the audit trail with a Terminal3 proof envelope.",
    };
  }

  return {
    mode: "fallback",
    error,
    content: `Current tracked spend is $${total.toFixed(2)} across ${expenses.length} expenses. Category totals: ${categories}.`,
  };
}

export async function answerWithLedgerMind(messages: ChatMessage[], expenses: Expense[]): Promise<LedgerMindAnswer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackAnswer(messages, expenses);

  const client = new OpenAI({ apiKey });
  const system = [
    "You are LedgerMind AI, a concise financial operations assistant.",
    "Use the provided expense ledger only; do not invent transactions.",
    "For payments, always say approval is required before execution.",
    "Mention Terminal3 verification only when describing protected actions, auditability, or approvals.",
  ].join(" ");

  const ledgerContext = JSON.stringify({
    totalSpend: totalSpend(expenses),
    categories: spendByCategory(expenses),
    expenses: expenses.slice(0, 25),
  });

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: `Ledger context: ${ledgerContext}` },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      max_output_tokens: 700,
    });

    return response.output_text
      ? { mode: "openai", content: response.output_text }
      : fallbackAnswer(messages, expenses, "OpenAI returned an empty response.");
  } catch (error) {
    console.error("LedgerMind OpenAI request failed", error);
    return fallbackAnswer(messages, expenses, error instanceof Error ? error.message : "OpenAI request failed.");
  }
}
