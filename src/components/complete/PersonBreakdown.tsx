"use client";

import type { Claim, Receipt, PersonTotal } from "@/types";
import Card from "@/components/ui/Card";

interface PersonBreakdownProps {
  personId: string;
  personName: string;
  claims: Claim[];
  receipt: Receipt;
  total: PersonTotal;
}

export default function PersonBreakdown({
  personId,
  personName,
  claims,
  receipt,
  total,
}: PersonBreakdownProps) {
  const myClaims = claims.filter((c) => c.participant_ids.includes(personId));

  return (
    <Card>
      <h3 className="font-semibold text-divvy-dark mb-3">{personName}</h3>
      <div className="space-y-2">
        {myClaims.map((claim) => {
          const item = receipt.line_items.find((i) => i.id === claim.line_item_id);
          if (!item) return null;

          const perPerson = (item.price * claim.share) / claim.participant_ids.length;
          const isSplit = claim.participant_ids.length > 1;

          return (
            <div key={claim.id} className="flex justify-between text-sm">
              <span className="text-divvy-dark/70">
                {item.name}
                {isSplit && (
                  <span className="text-divvy-dark/40 ml-1">
                    (1/{claim.participant_ids.length})
                  </span>
                )}
              </span>
              <span className="text-divvy-dark font-medium">
                ${perPerson.toFixed(2)}
              </span>
            </div>
          );
        })}

        <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
          <div className="flex justify-between text-sm text-divvy-dark/50">
            <span>Tax</span>
            <span>${total.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-divvy-dark/50">
            <span>Tip</span>
            <span>${total.tip.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-divvy-dark pt-1">
            <span>Total</span>
            <span>${total.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
