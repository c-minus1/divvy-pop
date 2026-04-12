"use client";

import Input from "@/components/ui/Input";

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

  const handleTaxAmountChange = (amount: number) => {
    const newRate = subtotal > 0 ? (amount / subtotal) * 100 : 0;
    onTaxChange(amount, Math.round(newRate * 1000) / 1000);
  };

  const handleTipRateChange = (rate: number) => {
    const newTip = subtotal * (rate / 100);
    onTipChange(Math.round(newTip * 100) / 100, rate);
  };

  const handleTipAmountChange = (amount: number) => {
    const newRate = subtotal > 0 ? (amount / subtotal) * 100 : 0;
    onTipChange(amount, Math.round(newRate * 1000) / 1000);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-divvy-dark/70">
        <span className="text-sm">Subtotal</span>
        <span className="font-medium">${subtotal.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center gap-3">
        <span className="text-sm text-divvy-dark/70 shrink-0">Tax</span>
        <div className="flex gap-2 items-center">
          <div className="w-20">
            <Input
              type="number"
              step="0.001"
              min="0"
              value={taxRate.toString()}
              onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
              className="!py-1.5 !px-2 text-sm text-right"
            />
          </div>
          <span className="text-xs text-divvy-dark/50">%</span>
          <div className="w-24">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={tax.toFixed(2)}
              onChange={(e) => handleTaxAmountChange(parseFloat(e.target.value) || 0)}
              className="!py-1.5 !px-2 text-sm text-right"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-3">
        <span className="text-sm text-divvy-dark/70 shrink-0">Tip</span>
        <div className="flex gap-2 items-center">
          <div className="w-20">
            <Input
              type="number"
              step="0.5"
              min="0"
              value={tipRate.toString()}
              onChange={(e) => handleTipRateChange(parseFloat(e.target.value) || 0)}
              className="!py-1.5 !px-2 text-sm text-right"
            />
          </div>
          <span className="text-xs text-divvy-dark/50">%</span>
          <div className="w-24">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={tip.toFixed(2)}
              onChange={(e) => handleTipAmountChange(parseFloat(e.target.value) || 0)}
              className="!py-1.5 !px-2 text-sm text-right"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <span className="font-semibold text-divvy-dark">Total</span>
        <span className="font-bold text-lg text-divvy-dark">
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
