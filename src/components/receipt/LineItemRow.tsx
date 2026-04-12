"use client";

import Input from "@/components/ui/Input";

interface LineItemRowProps {
  name: string;
  price: number;
  onNameChange: (name: string) => void;
  onPriceChange: (price: number) => void;
  onDelete: () => void;
}

export default function LineItemRow({
  name,
  price,
  onNameChange,
  onPriceChange,
  onDelete,
}: LineItemRowProps) {
  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1">
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Item name"
        />
      </div>
      <div className="w-24">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={price.toString()}
          onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
          placeholder="$0.00"
        />
      </div>
      <button
        onClick={onDelete}
        className="touch-target flex items-center justify-center text-red-400 hover:text-red-600 text-lg shrink-0"
        aria-label="Remove item"
      >
        &times;
      </button>
    </div>
  );
}
