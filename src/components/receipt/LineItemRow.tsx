"use client";

interface LineItemRowProps {
  name: string;
  price: number;
  index?: number;
  onNameChange: (name: string) => void;
  onPriceChange: (price: number) => void;
  onDelete: () => void;
}

export default function LineItemRow({
  name,
  price,
  index = 0,
  onNameChange,
  onPriceChange,
  onDelete,
}: LineItemRowProps) {
  const isAlt = index % 2 === 0;
  const rowBg = isAlt ? "bg-[#E5E7EB]" : "bg-white";
  const fieldClasses = `w-full rounded-xl px-4 py-2 ${rowBg} text-divvy-dark placeholder:text-divvy-dark/40 border border-black/5 focus:outline-none focus:ring-2 focus:ring-divvy-teal/60 transition-all`;

  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1">
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Item name"
          className={fieldClasses}
        />
      </div>
      <div className="w-28">
        <input
          type="number"
          step="0.01"
          min="0"
          value={price.toString()}
          onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
          placeholder="$ 0.00"
          className={`${fieldClasses} text-right`}
        />
      </div>
      <button
        onClick={onDelete}
        className="touch-target flex items-center justify-center text-red-400 hover:text-red-500 text-lg shrink-0"
        aria-label="Remove item"
      >
        &times;
      </button>
    </div>
  );
}
