"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import {
  getReceiptPhotoDataUrl,
  receiptPhotoFilename,
} from "@/lib/receipt-photo";

interface SaveReceiptPhotoProps {
  /** null = offer the still-pending photo (no receipt created yet). */
  receiptId: string | null;
  scannedAt?: number;
  className?: string;
}

export default function SaveReceiptPhoto({
  receiptId,
  scannedAt,
  className = "",
}: SaveReceiptPhotoProps) {
  // Lazy initializer with an SSR guard — sessionStorage doesn't exist during
  // prerender (same pattern as the parse-warning read on the receipt page).
  const [link] = useState(() => {
    if (typeof window === "undefined") return null;
    const href = getReceiptPhotoDataUrl(receiptId);
    if (!href) return null;
    const filename =
      scannedAt != null ? receiptPhotoFilename(scannedAt) : "divvy-receipt.jpg";
    return { href, filename };
  });

  if (!link) return null;

  return (
    <a
      href={link.href}
      download={link.filename}
      className={`inline-flex items-center gap-2 font-pixel text-[10px] text-divvy-teal tracking-wide underline underline-offset-4 ${className}`}
    >
      <Download size={14} strokeWidth={2} aria-hidden="true" />
      Save photo
    </a>
  );
}
