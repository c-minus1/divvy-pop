"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Camera, MessagesSquare, BadgeCheck } from "lucide-react";

function HomeContent() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "true";

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-divvy-gradient text-divvy-ink min-h-screen px-6">
      <main className="flex flex-col items-center gap-10 text-center max-w-md w-full">
        {expired && (
          <div className="w-full bg-amber-500/10 border border-amber-400/30 rounded-2xl px-4 py-3 text-amber-200 font-pixel text-[10px] leading-relaxed">
            That session has expired. Start a new one!
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <h1 className="font-pixel text-3xl sm:text-4xl text-divvy-gradient leading-relaxed">
            divvy
          </h1>
          <p className="font-pixel text-[10px] sm:text-xs text-divvy-ink">
            the smarter way to split
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <Camera size={40} strokeWidth={1.5} className="text-divvy-ink" />
            <p className="font-pixel text-xs text-divvy-ink">Scan</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <MessagesSquare size={40} strokeWidth={1.5} className="text-divvy-ink" />
            <p className="font-pixel text-xs text-divvy-ink">Share</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <BadgeCheck size={40} strokeWidth={1.5} className="text-divvy-ink" />
            <p className="font-pixel text-xs text-divvy-ink">Split</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
          <Link
            href="/scan"
            className="touch-target font-pixel tracking-wide w-full max-w-xs flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-divvy-green via-divvy-teal to-divvy-cyan text-divvy-dark text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Split a bill
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
