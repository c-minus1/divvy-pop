"use client";

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface ManualItem {
  name: string;
  price: string;
}

interface ManualEntryResult {
  items: { name: string; price: number }[];
  taxRate: number;
  tipRate: number;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

interface ManualEntryFormProps {
  onSubmit: (result: ManualEntryResult) => void;
  loading?: boolean;
}

export default function ManualEntryForm({ onSubmit, loading }: ManualEntryFormProps) {
  const [items, setItems] = useState<ManualItem[]>([
    { name: "", price: "" },
    { name: "", price: "" },
  ]);
  const [taxRate, setTaxRate] = useState("8.875");
  const [tipRate, setTipRate] = useState("20");

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    return sum + price;
  }, 0);

  const tax = subtotal * ((parseFloat(taxRate) || 0) / 100);
  const tip = subtotal * ((parseFloat(tipRate) || 0) / 100);
  const total = subtotal + tax + tip;

  const updateItem = useCallback(
    (index: number, field: keyof ManualItem, value: string) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      );
    },
    []
  );

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { name: "", price: "" }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = () => {
    const validItems = items
      .filter((item) => item.name.trim() && parseFloat(item.price) > 0)
      .map((item) => ({ name: item.name.trim(), price: parseFloat(item.price) }));

    if (validItems.length === 0) return;

    onSubmit({
      items: validItems,
      taxRate: parseFloat(taxRate) || 0,
      tipRate: parseFloat(tipRate) || 0,
      subtotal,
      tax,
      tip,
      total,
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <h3 className="font-semibold text-divvy-dark text-lg">Enter items manually</h3>

      {items.map((item, index) => (
        <Card key={index} className="!p-3">
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <Input
                placeholder="Item name"
                value={item.name}
                onChange={(e) => updateItem(index, "name", e.target.value)}
              />
            </div>
            <div className="w-24">
              <Input
                placeholder="$0.00"
                type="number"
                step="0.01"
                min="0"
                value={item.price}
                onChange={(e) => updateItem(index, "price", e.target.value)}
              />
            </div>
            {items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="touch-target flex items-center justify-center text-red-400 hover:text-red-600 text-lg shrink-0"
                aria-label="Remove item"
              >
                &times;
              </button>
            )}
          </div>
        </Card>
      ))}

      <Button variant="ghost" onClick={addItem}>
        + Add Item
      </Button>

      <Card className="!p-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tax %"
            type="number"
            step="0.001"
            min="0"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
          <Input
            label="Tip %"
            type="number"
            step="0.5"
            min="0"
            value={tipRate}
            onChange={(e) => setTipRate(e.target.value)}
          />
        </div>

        <div className="mt-4 space-y-1 text-sm text-divvy-dark/70">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tip</span>
            <span>${tip.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-divvy-dark text-base pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      <Button onClick={handleSubmit} loading={loading}>
        Continue
      </Button>
    </div>
  );
}
