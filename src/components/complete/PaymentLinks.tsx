"use client";

import { useState } from "react";

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

  const buttonBase =
    "touch-target w-full flex items-center justify-center px-6 py-3 rounded-2xl text-sm font-pixel tracking-wide transition-all active:scale-95";

  return (
    <div className="flex flex-col gap-3 w-full">
      <button
        onClick={copyAmount}
        className={`${buttonBase} bg-gradient-to-r from-divvy-green via-divvy-teal to-divvy-cyan text-divvy-dark shadow-lg`}
      >
        {copied ? "COPIED!" : "COPY TOTAL"}
      </button>

      <a
        href={`venmo://paycharge?txn=pay&amount=${formattedAmount}`}
        className={`${buttonBase} bg-white/5 text-divvy-ink border border-white/15 hover:bg-white/10`}
      >
        OPEN VENMO
      </a>

      <a
        href={`cashapp://cash.app/pay?amount=${formattedAmount}`}
        className={`${buttonBase} bg-white/5 text-divvy-ink border border-white/15 hover:bg-white/10`}
      >
        OPEN CASH APP
      </a>
    </div>
  );
}
