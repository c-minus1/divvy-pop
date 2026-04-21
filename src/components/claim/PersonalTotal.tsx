"use client";

import type { PersonTotal } from "@/types";

interface PersonalTotalProps {
  total: PersonTotal;
}

export default function PersonalTotal({ total }: PersonalTotalProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-divvy-bg-2/95 backdrop-blur-md border-t border-white/10 px-4 py-3 safe-area-inset z-40">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="font-pixel text-[10px] text-divvy-ink-dim tracking-wide">
              Your total
            </span>
            <div className="flex gap-3 text-xs text-divvy-ink-dim tabular-nums">
              <span>Items ${total.items.toFixed(2)}</span>
              <span>Tax ${total.tax.toFixed(2)}</span>
              <span>Tip ${total.tip.toFixed(2)}</span>
            </div>
          </div>
          <span className="text-2xl font-bold text-divvy-ink tabular-nums">
            ${total.total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
