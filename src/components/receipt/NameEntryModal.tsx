"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface NameEntryModalProps {
  isOpen: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function NameEntryModal({
  isOpen,
  loading = false,
  error,
  onClose,
  onSubmit,
}: NameEntryModalProps) {
  const [name, setName] = useState("");
  const trimmed = name.trim();

  const handleSubmit = () => {
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center gap-5 py-4">
        <h2 className="font-pixel text-base text-divvy-dark text-center">
          Enter your name
        </h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Your name"
          aria-label="Your name"
          className="touch-target w-full rounded-xl px-4 py-3 bg-white text-divvy-dark placeholder:text-divvy-dark/40 border border-black/10 focus:outline-none focus:ring-2 focus:ring-divvy-teal/60"
        />
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={!trimmed}
          className="!bg-gradient-to-r !from-divvy-green !to-divvy-teal"
        >
          Create session
        </Button>
      </div>
    </Modal>
  );
}
