"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AsciiWave } from "./ascii-wave";

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
      {/* Subtle grid */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      {/* ASCII Wave full width and height */}
      <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
        <AsciiWave className="w-full h-full" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-24">
        {/* Badge */}
        <div 
          className={`flex justify-center mb-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          
        </div>
        
        {/* Headline */}
        <div className="text-center max-w-5xl mx-auto mb-10">
          <h1 
            className={`text-5xl md:text-7xl font-semibold tracking-tight leading-[0.95] mb-8 transition-all duration-700 delay-100 lg:text-7xl ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ fontFamily: 'var(--font-geist-pixel-line), monospace' }}
          >
            <span className="text-balance">LedgerMind AI </span>
            <br />
            <span className="text-balance">runs finance actions with</span>{" "}
            <span className="text-primary">proof.</span>
          </h1>
          
          <p 
            className={`text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            A trusted AI expense agent for receipts, reports, approvals, and payments. 
            Every sensitive action is tied to a Terminal3-verifiable agent identity.
          </p>
        </div>
        
        {/* CTAs */}
        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-3 mb-20 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button 
            size="lg" 
            className="bg-foreground hover:bg-foreground/90 text-background px-6 h-11 text-sm font-medium group"
            asChild
          >
            <a href="/dashboard">
              Open Dashboard
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="h-11 px-6 text-sm font-medium border-border hover:bg-secondary/50 bg-transparent"
            asChild
          >
            <a href="/agents">Verify Agents</a>
          </Button>
        </div>
        
        {/* Stats with company logos style */}
        <div 
          className={`grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden card-shadow transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {[
            { value: "4", label: "scoped finance agents.", company: "TERMINAL3" },
            { value: "100%", label: "sensitive actions logged.", company: "AUDIT" },
            { value: "0", label: "raw payment secrets in prompts.", company: "TEE" },
            { value: "1-click", label: "human approval before pay.", company: "POLICY" },
          ].map((stat) => (
            <div key={stat.company} className="p-6 lg:p-8 flex justify-between min-h-[140px] bg-black shadow-none lg:py-8 flex-col">
              <div>
                <span className="text-xl lg:text-2xl font-semibold">{stat.value}</span>
                <span className="text-muted-foreground text-sm lg:text-base"> {stat.label}</span>
              </div>
              <div className="font-mono text-xs text-muted-foreground/60 tracking-widest mt-4">
                {stat.company}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
