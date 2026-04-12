"use client";

import type { Participant } from "@/types";
import Card from "@/components/ui/Card";

interface ParticipantListProps {
  participants: Participant[];
}

export default function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-divvy-dark/70 mb-3">
        Participants ({participants.length})
      </h3>
      <div className="space-y-2">
        {participants.map((p, index) => (
          <div
            key={p.id}
            className="flex items-center gap-3 py-2 animate-slide-up"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-divvy-green to-divvy-cyan flex items-center justify-center text-white text-xs font-bold">
              {p.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-divvy-dark">{p.name}</span>
            {index === 0 && (
              <span className="text-xs bg-divvy-teal/10 text-divvy-teal px-2 py-0.5 rounded-full">
                Host
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
