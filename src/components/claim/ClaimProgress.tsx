"use client";

interface ClaimProgressProps {
  claimed: number;
  total: number;
}

export default function ClaimProgress({ claimed, total }: ClaimProgressProps) {
  const progress = total > 0 ? (claimed / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-divvy-dark/60 mb-1">
        <span>
          {claimed} of {total} items claimed
        </span>
        {claimed === total && <span className="text-divvy-green font-medium">All done!</span>}
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-divvy-green to-divvy-teal rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
