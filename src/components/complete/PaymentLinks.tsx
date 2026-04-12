"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface PaymentLinksProps {
  amount: number;
}

export default function PaymentLinks({ amount }: PaymentLinksProps) {
  const [copied, setCopied] = useState(false);
  const formattedAmount = amount.toFixed(2);

  const copyAmount = async () => {
    try {
      await navigator.clipboard.writeText(`$${formattedAmount}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = `$${formattedAmount}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <h3 className="text-sm font-semibold text-divvy-dark/70 mb-1">
        Pay ${formattedAmount}
      </h3>

      <a
        href={`venmo://paycharge?txn=pay&amount=${formattedAmount}`}
        className="touch-target w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#008CFF] text-white font-semibold transition-all active:scale-95"
      >
        Venmo
      </a>

      <a
        href={`cashapp://cash.app/pay?amount=${formattedAmount}`}
        className="touch-target w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#00D632] text-white font-semibold transition-all active:scale-95"
      >
        Cash App
      </a>

      <Button variant="ghost" onClick={copyAmount}>
        {copied ? "Copied!" : `Copy $${formattedAmount}`}
      </Button>
    </div>
  );
}
