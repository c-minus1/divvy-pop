"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { LineItem, Participant } from "@/types";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: LineItem | null;
  participants: Participant[];
  currentUserId: string;
  onClaimIndividual: (item: LineItem) => void;
  onClaimSplit: (item: LineItem, participantIds: string[]) => void;
  onClaimAll: (item: LineItem) => void;
}

export default function ClaimModal({
  isOpen,
  onClose,
  item,
  participants,
  currentUserId,
  onClaimIndividual,
  onClaimSplit,
  onClaimAll,
}: ClaimModalProps) {
  const [mode, setMode] = useState<"choose" | "split">("choose");
  const [selectedIds, setSelectedIds] = useState<string[]>([currentUserId]);

  if (!item) return null;

  const handleJustMe = () => {
    onClaimIndividual(item);
    resetAndClose();
  };

  const handleSharedByAll = () => {
    onClaimAll(item);
    resetAndClose();
  };

  const handleSplitConfirm = () => {
    if (selectedIds.length < 2) return;
    onClaimSplit(item, selectedIds);
    resetAndClose();
  };

  const toggleParticipant = (pid: string) => {
    setSelectedIds((prev) =>
      prev.includes(pid)
        ? pid === currentUserId
          ? prev
          : prev.filter((id) => id !== pid)
        : [...prev, pid]
    );
  };

  const resetAndClose = () => {
    setMode("choose");
    setSelectedIds([currentUserId]);
    onClose();
  };

  const pricePerPerson =
    mode === "split" && selectedIds.length > 0
      ? item.price / selectedIds.length
      : item.price;

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={item.name}>
      <div className="flex flex-col gap-3">
        <p className="text-2xl font-bold text-divvy-dark mb-2 tabular-nums">
          ${item.price.toFixed(2)}
        </p>

        {mode === "choose" && (
          <>
            <Button onClick={handleJustMe}>Just Me</Button>
            <Button variant="ghost" onClick={() => setMode("split")} className="!bg-black/5 !text-divvy-dark !border-black/10">
              Split with Others
            </Button>
            <Button variant="ghost" onClick={handleSharedByAll} className="!bg-black/5 !text-divvy-dark !border-black/10">
              Shared by All
            </Button>
          </>
        )}

        {mode === "split" && (
          <>
            <p className="text-sm text-divvy-dark/70 mb-1">
              Select who&apos;s sharing this item:
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {participants.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedIds.includes(p.id)
                      ? "bg-divvy-teal/20 border-2 border-divvy-teal/60"
                      : "bg-white/60 border-2 border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleParticipant(p.id)}
                    disabled={p.id === currentUserId}
                    className="accent-divvy-teal w-4 h-4"
                  />
                  <span className="font-medium text-divvy-dark">
                    {p.id === currentUserId ? `${p.name} (you)` : p.name}
                  </span>
                </label>
              ))}
            </div>

            <div className="bg-white/60 rounded-xl p-3 text-center mt-2">
              <span className="text-sm text-divvy-dark/70 tabular-nums">
                ${pricePerPerson.toFixed(2)} per person
              </span>
            </div>

            <div className="flex gap-2 mt-2">
              <Button variant="ghost" onClick={() => setMode("choose")} className="!bg-black/5 !text-divvy-dark !border-black/10">
                Back
              </Button>
              <Button onClick={handleSplitConfirm} disabled={selectedIds.length < 2}>
                Split ({selectedIds.length})
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
