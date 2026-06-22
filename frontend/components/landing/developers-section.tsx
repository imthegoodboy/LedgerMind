"use client";

import { useState } from "react";
import { AsciiDna } from "./ascii-dna";
import { Copy, Check } from "lucide-react";

const codeExamples = [
  {
    label: "Initialize",
    code: `import { T3nClient, setEnvironment } from '@terminal3/t3n-sdk'

setEnvironment('testnet')
const client = new T3nClient({ wasmComponent, handlers })`,
  },
  {
    label: "Authenticate",
    code: `await client.handshake()
const did = await client.authenticate(authInput)

const tenant = new TenantClient({
  t3n: client,
  tenantDid: did.value
})`,
  },
  {
    label: "Protect",
    code: `await client.executeAndDecode({
  script_name: 'z:<tid>:ledgermind',
  function_name: 'generate-report',
  input: { month: '2026-06' }
})`,
  },
];

const features = [
  { 
    title: "TypeScript-first", 
    description: "Terminal3 SDK routes are typed and isolated in server-only modules."
  },
  { 
    title: "TEE-ready contracts", 
    description: "The app exposes a clean path for tenant maps, secrets, contract registration, and invocation."
  },
  { 
    title: "Audit by default", 
    description: "Every API action returns a proof envelope and writes an audit row."
  },
  { 
    title: "Production deployable", 
    description: "Next API routes keep one Vercel deployment while still supporting a separate backend later."
  },
];

export function DevelopersSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developers" className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Content */}
          <div>
            <p className="text-sm font-mono text-primary mb-3">{"// SDK INTEGRATION"}</p>
            <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight mb-6 text-balance">
              Built around the<br />Terminal3 SDK.
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              The Terminal3 adapter uses the real npm SDK for testnet environment setup, WASM crypto, ETH auth,
              session creation, usage reads, tenant helpers, and contract invocation paths.
            </p>
            
            {/* Features list */}
            <div className="grid gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="w-1 bg-primary/30 rounded-full shrink-0" />
                  <div>
                    <h3 className="font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* ASCII DNA decoration */}
            
          </div>
          
          {/* Right: Code block */}
          <div className="lg:sticky lg:top-32">
            <div className="rounded-xl overflow-hidden bg-card border border-border card-shadow">
              {/* Tabs */}
              <div className="flex items-center gap-1 p-2 border-b border-border bg-secondary/30">
                {codeExamples.map((example, idx) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                      activeTab === idx
                        ? "bg-card text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {example.label}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Code content */}
              <div className="p-6 font-mono text-sm overflow-x-auto">
                <pre className="text-muted-foreground">
                  <code>
                    {codeExamples[activeTab].code.split('\n').map((line, i) => (
                      <div key={i} className="leading-relaxed">
                        <span className="text-muted-foreground/40 select-none w-8 inline-block">{i + 1}</span>
                        <span className="text-muted-foreground">{line}</span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
              
              {/* Terminal output */}
              <div className="border-t border-border p-4 bg-secondary/20">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
                  <span className="text-green-500">$</span>
                  <span>pnpm add @terminal3/t3n-sdk</span>
                </div>
                <div className="text-xs font-mono text-muted-foreground/60">
                  added 1 package in 0.4s
                </div>
              </div>
            </div>
            
            {/* Docs link */}
            <div className="mt-6 flex items-center gap-4 text-sm">
              <a href="https://docs.terminal3.io/developers/adk/overview/what-is-adk" className="text-primary hover:underline font-mono">
                Read Terminal3 docs
              </a>
              <span className="text-border">|</span>
              <a href="/agents" className="text-muted-foreground hover:text-foreground font-mono">
                Open app routes
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
