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
  const nameTextClasses = "whitespace-pre-wrap break-words";

  return (
    <div className="flex gap-2 items-center">
      {/* Auto-growing name field: an invisible mirror of the text sits in the
          same grid cell as the textarea, so the row is always tall enough to
          show the full name instead of clipping it on one line. */}
      <div className="flex-1 grid">
        <span
          aria-hidden="true"
          className={`${fieldClasses} ${nameTextClasses} invisible col-start-1 row-start-1`}
        >
          {name || "Item name"}{" "}
        </span>
        <textarea
          value={name}
          rows={1}
          onChange={(e) => onNameChange(e.target.value.replace(/\n/g, " "))}
          placeholder="Item name"
          className={`${fieldClasses} ${nameTextClasses} col-start-1 row-start-1 h-full resize-none overflow-hidden`}
        />
      </div>
      <div className="w-28 self-stretch flex">
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
