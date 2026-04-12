"use client";

import { QRCodeSVG } from "qrcode.react";
import Card from "@/components/ui/Card";

interface QRDisplayProps {
  sessionId: string;
}

export default function QRDisplay({ sessionId }: QRDisplayProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  const joinUrl = `${baseUrl}/join/${sessionId}`;

  return (
    <Card className="flex flex-col items-center gap-4 py-8">
      <QRCodeSVG
        value={joinUrl}
        size={220}
        level="M"
        bgColor="transparent"
        fgColor="#1a1a2e"
        className="rounded-lg"
      />
      <p className="text-sm text-divvy-dark/50">
        Scan to join this split
      </p>
    </Card>
  );
}
