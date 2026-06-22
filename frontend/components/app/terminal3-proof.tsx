import { ShieldCheck } from "lucide-react";
import type { Terminal3Proof } from "@/lib/ledger-types";
import { cn } from "@/lib/utils";

export function Terminal3ProofStrip({ proof, compact = false }: { proof: Terminal3Proof; compact?: boolean }) {
  const liveExecuted = proof.mode === "live" && proof.contractExecution === "executed";

  return (
    <div
      className={cn(
        "grid gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 font-mono text-xs text-muted-foreground",
        !compact && "md:grid-cols-5",
      )}
    >
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck className="h-4 w-4" />
        <span>{liveExecuted ? "Terminal3 executed" : proof.mode === "live" ? "Terminal3 live session" : "Terminal3 fallback"}</span>
      </div>
      <div>
        <span className="text-muted-foreground/60">agent </span>
        <span className="text-foreground">{proof.agentDid}</span>
      </div>
      <div>
        <span className="text-muted-foreground/60">function </span>
        <span className="text-foreground">{proof.functionName}</span>
      </div>
      <div>
        <span className="text-muted-foreground/60">digest </span>
        <span className="text-foreground">{proof.digest.slice(0, 14)}...</span>
      </div>
      {!compact && (
        <div>
          <span className="text-muted-foreground/60">contract </span>
          <span className="text-foreground">{proof.contractExecution}</span>
        </div>
      )}
    </div>
  );
}
