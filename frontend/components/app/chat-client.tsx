"use client";

import { FormEvent, useState } from "react";
import { Bot, Loader2, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Terminal3ProofStrip } from "@/components/app/terminal3-proof";
import type { AuditLog, ChatMessage } from "@/lib/ledger-types";
import { cn } from "@/lib/utils";

const prompts = [
  "Analyze my expenses this month.",
  "Which expenses are tax deductible?",
  "Pay AWS bill.",
  "Show software spend and export a summary.",
];

export function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask about spend, taxes, receipts, or payments. Sensitive actions will go through a Terminal3-scoped agent approval flow.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAudit, setLastAudit] = useState<AuditLog | null>(null);

  async function sendMessage(value: string) {
    const content = value.trim();
    if (!content || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.filter((message) => message.role !== "assistant" || message.content.length > 0) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Chat failed");
      setMessages((current) => [...current, data.message]);
      setLastAudit(data.auditLog);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "The chat agent could not complete the request.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-6 lg:grid-cols-[0.72fr_0.28fr]">
      <section className="flex min-h-[640px] flex-col rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <p className="font-mono text-xs text-primary">{"// AI CHAT"}</p>
          <h1 className="mt-2 text-3xl font-semibold">LedgerMind Assistant</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Natural-language finance actions with Terminal3 identity attached to every operation.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn("flex gap-3", message.role === "user" && "justify-end")}
            >
              {message.role === "assistant" && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6",
                  message.role === "assistant" ? "bg-secondary/60 text-foreground" : "bg-foreground text-background",
                )}
              >
                {message.content}
              </div>
              {message.role === "user" && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                  <UserRound className="h-4 w-4" />
                </span>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              verifying agent action
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-border p-4">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask LedgerMind to analyze, classify, report, or prepare an approval..."
              className="min-h-12 resize-none"
            />
            <Button type="submit" className="h-auto px-4" disabled={loading} aria-label="Send message">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </section>

      <aside className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-xl font-semibold">Command Starters</h2>
          <div className="mt-4 space-y-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-xl font-semibold">Last Protected Action</h2>
          {lastAudit ? (
            <div className="mt-4 space-y-4">
              <div className="text-sm text-muted-foreground">{lastAudit.summary}</div>
              <Terminal3ProofStrip proof={lastAudit.terminal3} compact />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Send a message to create the first audit row.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
