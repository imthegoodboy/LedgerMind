"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/upload", label: "Receipts", icon: ReceiptText },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/agents", label: "Agents", icon: Bot },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="fixed inset-0 grid-pattern opacity-40" />
      <div className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </span>
            <span className="font-semibold tracking-tight">LedgerMind AI</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
                    active && "bg-secondary text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/agents"
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Verify SDK
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              aria-label="Lock workspace"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-6">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-14 items-center justify-center text-muted-foreground",
                  active && "text-primary",
                )}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
