"use client";

import type { Participant } from "@/types";

interface ParticipantListProps {
  participants: Participant[];
}

export default function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <div className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-6">
      <h3 className="font-pixel text-[10px] text-divvy-ink-dim mb-3 tracking-wide">
        Participants ({participants.length})
      </h3>
      <div className="space-y-2">
        {participants.map((p, index) => (
          <div
            key={p.id}
            className="flex items-center gap-3 py-2 animate-slide-up"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-divvy-green to-divvy-cyan flex items-center justify-center text-divvy-dark text-xs font-bold">
              {p.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-divvy-ink">{p.name}</span>
            {index === 0 && (
              <span className="font-pixel text-[9px] bg-divvy-teal/20 text-divvy-teal px-2 py-1 rounded-full tracking-wide">
                Host
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
