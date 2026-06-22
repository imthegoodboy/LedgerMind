"use client";

import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import { Terminal } from "lucide-react";

const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Terminal3 Flow", href: "#how-it-works" },
    { name: "Proof Metrics", href: "#metrics" },
    { name: "Dashboard", href: "/dashboard" },
  ],
  Developers: [
    { name: "Terminal3 Docs", href: "https://docs.terminal3.io/developers/adk/overview/what-is-adk" },
    { name: "Agent Monitor", href: "/agents" },
    { name: "SDK", href: "#developers" },
    { name: "Activity", href: "/activity" },
  ],
  Company: [
    { name: "Chat", href: "/chat" },
    { name: "Receipts", href: "/upload" },
    { name: "Reports", href: "/reports" },
    { name: "Project", href: "#features" },
  ],
  Legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "Security", href: "#" },
  ],
};

export function FooterSection() {
  return (
    <footer className="relative border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold text-lg tracking-tight">LedgerMind</span>
              </Link>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Trusted AI expense operations with Terminal3 agent identity, approvals, and audit logs.
              </p>

              {/* Social Links */}
              <div className="flex gap-3">
                <a
                  href="https://www.terminal3.io/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com/Terminal-3"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium mb-4">{title}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            2026 LedgerMind AI. Built for the Terminal3 ADK challenge.
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Agent proof layer online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
