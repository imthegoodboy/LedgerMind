"use client";

import { useEffect, useState, useRef } from "react";
import { AsciiDna } from "./ascii-dna";

const regions = [
  { name: "Receipt Agent", nodes: 3, latency: "low" },
  { name: "Category Agent", nodes: 4, latency: "medium" },
  { name: "Report Agent", nodes: 4, latency: "medium" },
  { name: "Payment Agent", nodes: 2, latency: "high" },
  { name: "Audit Writer", nodes: 5, latency: "sealed" },
  { name: "Policy Engine", nodes: 3, latency: "scoped" },
];

export function InfrastructureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 bg-muted/30 overflow-hidden">
      {/* ASCII DNA Background */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
        <AsciiDna className="w-[600px] h-[500px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <p className="text-sm font-mono text-primary mb-4">{"// AGENT INFRASTRUCTURE"}</p>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight mb-6 text-balance">
              Built for accountable money movement.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              LedgerMind separates every responsibility into a scoped agent so receipt parsing, categorization, reporting, 
              and payments never share unnecessary permission.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <pre className="font-mono text-2xl text-primary">ID</pre>
                <div>
                  <h3 className="font-semibold mb-1">Identity Before Action</h3>
                  <p className="text-sm text-muted-foreground">
                    The server authenticates through Terminal3 before a protected workflow is recorded
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <pre className="font-mono text-2xl text-primary">OK</pre>
                <div>
                  <h3 className="font-semibold mb-1">Approval Gates</h3>
                  <p className="text-sm text-muted-foreground">
                    Payment intents are prepared separately and wait for explicit human approval
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <pre className="font-mono text-2xl text-primary">[]</pre>
                <div>
                  <h3 className="font-semibold mb-1">Immutable Evidence</h3>
                  <p className="text-sm text-muted-foreground">
                    Action digest, agent DID, contract function, and status are kept with the audit row
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Regions Grid */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="grid grid-cols-1 gap-3">
              {regions.map((region, index) => (
                <div
                  key={region.name}
                  className="group relative bg-card rounded-lg p-5 border border-border card-shadow hover:border-primary/50 transition-all duration-300"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{region.name}</h4>
                    <span className="font-mono text-xs text-primary">{region.latency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: region.nodes }).map((_, i) => (
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary/70 animate-pulse"
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {region.nodes} {region.nodes === 1 ? "node" : "nodes"}
                    </span>
                  </div>
                  
                  {/* Animated ASCII Network Visualization */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity font-mono text-xs text-primary">
                    <pre>{`
  ┌───┐
  │ ◉ │
  └─┬─┘
    │
`}</pre>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 p-6 rounded-lg bg-foreground/5 border border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-mono text-2xl font-semibold text-primary">4</div>
                  <div className="text-xs text-muted-foreground">Agents</div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold text-primary">TEE</div>
                  <div className="text-xs text-muted-foreground">Session</div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold text-primary">100%</div>
                  <div className="text-xs text-muted-foreground">Logged</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
