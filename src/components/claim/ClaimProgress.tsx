"use client";

interface ClaimProgressProps {
  claimed: number;
  total: number;
}

export default function ClaimProgress({ claimed, total }: ClaimProgressProps) {
  const progress = total > 0 ? (claimed / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between font-pixel text-[10px] text-divvy-ink-dim mb-2 tracking-wide">
        <span>
          {claimed} of {total} items claimed
        </span>
        {claimed === total && <span className="text-divvy-green">All done!</span>}
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-divvy-green to-divvy-teal rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
