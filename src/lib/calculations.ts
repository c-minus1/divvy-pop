import type { Claim, Receipt, PersonTotal } from "@/types";

export function calculatePersonShare(
  personId: string,
  claims: Claim[],
  receipt: Receipt
): PersonTotal {
  // 1. Sum this person's item share
  const itemsTotal = claims
    .filter((c) => c.participant_ids.includes(personId))
    .reduce((sum, c) => {
      const item = receipt.line_items.find((i) => i.id === c.line_item_id);
      if (!item) return sum;
      return sum + (item.price * c.share) / c.participant_ids.length;
    }, 0);

  // 2. Proportional tax and tip
  const ratio = receipt.subtotal > 0 ? itemsTotal / receipt.subtotal : 0;
  const taxShare = ratio * receipt.tax;
  const tipShare = ratio * receipt.tip;

  return {
    items: round2(itemsTotal),
    tax: round2(taxShare),
    tip: round2(tipShare),
    total: round2(itemsTotal + taxShare + tipShare),
  };
}

export function calculateAllShares(
  participantIds: string[],
  claims: Claim[],
  receipt: Receipt
): Map<string, PersonTotal> {
  const shares = new Map<string, PersonTotal>();
  for (const pid of participantIds) {
    shares.set(pid, calculatePersonShare(pid, claims, receipt));
  }
  return adjustForRounding(shares, receipt);
}

export function adjustForRounding(
  shares: Map<string, PersonTotal>,
  receipt: Receipt
): Map<string, PersonTotal> {
  const entries = Array.from(shares.entries());
  if (entries.length === 0) return shares;

  const sumTotal = entries.reduce((s, [, v]) => s + v.total, 0);
  const diff = round2(receipt.total - sumTotal);

  if (diff !== 0) {
    // Assign penny difference to the person with the largest share
    let maxEntry = entries[0];
    for (const entry of entries) {
      if (entry[1].total > maxEntry[1].total) {
        maxEntry = entry;
      }
    }
    const adjusted = { ...maxEntry[1] };
    adjusted.total = round2(adjusted.total + diff);
    shares.set(maxEntry[0], adjusted);
  }

  return shares;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
