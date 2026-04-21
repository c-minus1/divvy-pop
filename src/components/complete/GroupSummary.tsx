"use client";

import { useState } from "react";
import type { Participant, PersonTotal } from "@/types";
import Card from "@/components/ui/Card";

interface GroupSummaryProps {
  participants: Participant[];
  shares: Map<string, PersonTotal>;
  receiptTotal: number;
}

export default function GroupSummary({
  participants,
  shares,
  receiptTotal,
}: GroupSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const groupTotal = Array.from(shares.values()).reduce(
    (sum, s) => sum + s.total,
    0
  );
  const matches = Math.abs(groupTotal - receiptTotal) < 0.02;

  return (
    <Card>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="font-pixel text-xs text-divvy-ink tracking-wide">
          Group summary
        </h3>
        <div className="flex items-center gap-2">
          {matches && <span className="text-divvy-green text-sm">&#10003;</span>}
          <span className="text-divvy-ink-dim text-sm">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {participants.map((p) => {
            const share = shares.get(p.id);
            if (!share) return null;
            return (
              <div key={p.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-divvy-green to-divvy-cyan flex items-center justify-center text-divvy-dark text-[10px] font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-divvy-ink">{p.name}</span>
                </div>
                <span className="font-medium text-divvy-ink tabular-nums">
                  ${share.total.toFixed(2)}
                </span>
              </div>
            );
          })}

          <div className="border-t border-white/10 pt-2 flex justify-between items-center">
            <span className="text-sm text-divvy-ink-dim">Group total</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-divvy-ink tabular-nums">
                ${groupTotal.toFixed(2)}
              </span>
              {matches && (
                <span className="font-pixel text-[10px] text-divvy-green tracking-wide">
                  = receipt total
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
