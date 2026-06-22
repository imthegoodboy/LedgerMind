import { NextResponse } from "next/server";
import { listExpenses } from "@/lib/server/db";
import { answerWithLedgerMind } from "@/lib/server/openai";
import { recordProtectedAction } from "@/lib/server/actions";
import type { ChatMessage, ProtectedActionInput } from "@/lib/ledger-types";
import { requireApiAccess } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function inferAction(message: string): ProtectedActionInput {
  const text = message.toLowerCase();

  if (text.includes("pay") || text.includes("bill") || text.includes("transfer")) {
    return {
      agentId: "payment-agent",
      action: "prepare payment intent",
      target: text.includes("aws") ? "AWS bill" : "requested bill",
      risk: "high",
      requiresApproval: true,
      status: "pending_approval",
      amount: text.includes("aws") ? 500 : undefined,
      currency: "USD",
    };
  }

  if (text.includes("tax") || text.includes("report") || text.includes("export")) {
    return {
      agentId: "report-agent",
      action: "generate report",
      target: text.includes("tax") ? "tax deductible expenses" : "expense report",
      risk: "medium",
    };
  }

  return {
    agentId: "category-agent",
    action: "answer natural language ledger query",
    target: "expense ledger",
    risk: "low",
  };
}

export async function POST(request: Request) {
  const guarded = await requireApiAccess(request, { key: "chat", limit: 20, mutating: true });
  if (guarded) return guarded;

  const body = (await request.json()) as { messages?: ChatMessage[] };
  const messages = body.messages?.filter((message) => message.role && message.content) ?? [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages are required" }, { status: 400 });
  }

  const expenses = await listExpenses();
  const last = messages[messages.length - 1].content;
  const action = inferAction(last);
  const [answer, auditLog] = await Promise.all([
    answerWithLedgerMind(messages, expenses),
    recordProtectedAction({
      ...action,
      payload: { prompt: last, messageCount: messages.length },
    }),
  ]);

  return NextResponse.json({ message: { role: "assistant", content: answer.content }, aiMode: answer.mode, auditLog });
}
