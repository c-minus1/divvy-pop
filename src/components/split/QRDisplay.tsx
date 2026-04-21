"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRDisplayProps {
  sessionId: string;
}

export default function QRDisplay({ sessionId }: QRDisplayProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  const joinUrl = `${baseUrl}/join/${sessionId}`;

  return (
    <div className="flex flex-col items-center gap-4 w-full rounded-2xl bg-white/[0.04] border border-white/10 p-6">
      <div className="bg-white rounded-2xl p-4">
        <QRCodeSVG
          value={joinUrl}
          size={220}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#0A0A0A"
        />
      </div>
      <p className="font-pixel text-[10px] text-divvy-ink-dim">
        Scan to join this split
      </p>
    </div>
  );
}
