"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function HomeContent() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "true";

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-divvy-gradient min-h-screen px-6">
      <main className="flex flex-col items-center gap-8 text-center max-w-md w-full">
        {expired && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-800 text-sm">
            That session has expired. Start a new one!
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <h1 className="font-pixel text-3xl sm:text-4xl text-divvy-gradient leading-relaxed">
            divvy
          </h1>
          <p className="text-divvy-dark/70 text-lg font-medium">
            the smarter way to split
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 w-full mt-4">
          <Link
            href="/scan"
            className="touch-target w-full max-w-xs flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-divvy-green via-divvy-teal to-divvy-cyan text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Split a Bill
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center text-2xl shadow-sm">
              📸
            </div>
            <p className="text-sm font-medium text-divvy-dark/70">Scan</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center text-2xl shadow-sm">
              📲
            </div>
            <p className="text-sm font-medium text-divvy-dark/70">Share</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center text-2xl shadow-sm">
              ✂️
            </div>
            <p className="text-sm font-medium text-divvy-dark/70">Split</p>
          </div>
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
