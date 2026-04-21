"use client";

import type { LineItem, Claim, Participant } from "@/types";

interface ClaimableItemProps {
  item: LineItem;
  claims: Claim[];
  participants: Participant[];
  currentUserId: string;
  onClaim: (item: LineItem) => void;
  onUnclaim: (claimId: string) => void;
}

export default function ClaimableItem({
  item,
  claims,
  participants,
  currentUserId,
  onClaim,
  onUnclaim,
}: ClaimableItemProps) {
  const itemClaims = claims.filter((c) => c.line_item_id === item.id);
  const myClaim = itemClaims.find((c) => c.participant_ids.includes(currentUserId));
  const isClaimed = itemClaims.length > 0;
  const isClaimedByMe = !!myClaim;

  const getClaimLabel = () => {
    if (!isClaimed) return null;

    const allClaimers = itemClaims.flatMap((c) => c.participant_ids);
    const uniqueClaimers = [...new Set(allClaimers)];
    const names = uniqueClaimers
      .map((pid) => {
        if (pid === currentUserId) return "You";
        return participants.find((p) => p.id === pid)?.name || "Someone";
      })
      .join(", ");

    if (uniqueClaimers.length > 1) {
      return `Split: ${names}`;
    }
    return names;
  };

  const handleClick = () => {
    if (isClaimedByMe && myClaim) {
      onUnclaim(myClaim.id);
    } else if (!isClaimed) {
      onClaim(item);
    } else if (!isClaimedByMe) {
      onClaim(item);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98] ${
        isClaimedByMe
          ? "bg-divvy-green/20 border border-divvy-green/60 text-divvy-ink"
          : isClaimed
          ? "bg-[#E5E7EB] border border-black/5 text-divvy-dark/60"
          : "bg-white border border-white text-divvy-dark hover:border-divvy-teal/40"
      }`}
    >
      <div className="flex flex-col items-start gap-1">
        <span className="font-medium">{item.name}</span>
        {isClaimed && (
          <span className={`text-xs ${isClaimedByMe ? "text-divvy-ink/80" : "text-divvy-dark/50"}`}>
            {getClaimLabel()}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`font-semibold tabular-nums ${
            isClaimedByMe ? "text-divvy-green" : ""
          }`}
        >
          ${item.price.toFixed(2)}
        </span>
        {isClaimedByMe && (
          <span className="text-divvy-green text-lg">&#10003;</span>
        )}
      </div>
    </button>
  );
}
