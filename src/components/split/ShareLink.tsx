"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface ShareLinkProps {
  sessionId: string;
}

export default function ShareLink({ sessionId }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  const joinUrl = `${baseUrl}/join/${sessionId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = joinUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my Divvy split",
          text: "Scan this to split the bill!",
          url: joinUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }
    handleCopy();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <div className="flex-1 bg-white/50 rounded-xl px-4 py-3 text-sm text-divvy-dark/70 truncate border border-white/60">
          {joinUrl}
        </div>
        <Button variant="ghost" fullWidth={false} onClick={handleCopy} className="!px-4">
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <Button variant="ghost" onClick={handleShare}>
          Share Link
        </Button>
      )}
    </div>
  );
}
