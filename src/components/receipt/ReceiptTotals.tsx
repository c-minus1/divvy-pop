"use client";

interface ReceiptTotalsProps {
  subtotal: number;
  tax: number;
  taxRate: number;
  tip: number;
  tipRate: number;
  total: number;
  onTaxChange: (tax: number, taxRate: number) => void;
  onTipChange: (tip: number, tipRate: number) => void;
}

const chipBase =
  "rounded-xl px-4 py-2 bg-divvy-teal text-divvy-dark flex items-center";
const chipField =
  "w-full bg-transparent focus:outline-none placeholder:text-divvy-dark/40";

export default function ReceiptTotals({
  subtotal,
  tax,
  taxRate,
  tip,
  tipRate,
  total,
  onTaxChange,
  onTipChange,
}: ReceiptTotalsProps) {
  const handleTaxRateChange = (rate: number) => {
    const newTax = subtotal * (rate / 100);
    onTaxChange(Math.round(newTax * 100) / 100, rate);
  };

  const handleTipRateChange = (rate: number) => {
    const newTip = subtotal * (rate / 100);
    onTipChange(Math.round(newTip * 100) / 100, rate);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Subtotal */}
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <div className={`${chipBase} font-semibold`}>Subtotal</div>
        <div className={`${chipBase} justify-end w-32 font-semibold tabular-nums`}>
          $ {subtotal.toFixed(2)}
        </div>
      </div>

      {/* Tax */}
      <div className="grid grid-cols-[1fr_5rem_auto] gap-2 items-center">
        <div className={`${chipBase}`}>Tax</div>
        <div className={`${chipBase}`}>
          <input
            type="number"
            step="0.001"
            min="0"
            value={taxRate.toString()}
            onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
            className={`${chipField} text-right tabular-nums`}
            aria-label="Tax percentage"
          />
          <span className="ml-1 text-divvy-dark/70">%</span>
        </div>
        <div className={`${chipBase} justify-end w-32 tabular-nums`}>
          $ {tax.toFixed(2)}
        </div>
      </div>

      {/* Tip */}
      <div className="grid grid-cols-[1fr_5rem_auto] gap-2 items-center">
        <div className={`${chipBase}`}>Tip</div>
        <div className={`${chipBase}`}>
          <input
            type="number"
            step="0.5"
            min="0"
            value={tipRate.toString()}
            onChange={(e) => handleTipRateChange(parseFloat(e.target.value) || 0)}
            className={`${chipField} text-right tabular-nums`}
            aria-label="Tip percentage"
          />
          <span className="ml-1 text-divvy-dark/70">%</span>
        </div>
        <div className={`${chipBase} justify-end w-32 tabular-nums`}>
          $ {tip.toFixed(2)}
        </div>
      </div>

      {/* Total */}
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <div className={`${chipBase} bg-divvy-cyan font-bold`}>Total</div>
        <div className={`${chipBase} bg-divvy-cyan justify-end w-32 font-bold tabular-nums`}>
          $ {total.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
