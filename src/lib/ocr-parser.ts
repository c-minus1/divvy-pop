import type { LineItem } from "@/types";

export interface ParsedReceipt {
  line_items: Omit<LineItem, "id">[];
  subtotal: number;
  tax: number;
  total: number;
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  const items: Omit<LineItem, "id">[] = [];
  let subtotal = 0;
  let tax = 0;
  let total = 0;
  let itemOrder = 0;

  // Patterns for summary lines (subtotal, tax, total, tip, etc.)
  const subtotalPattern = /^(sub\s*total|subtotal)/i;
  const taxPattern = /^(sales\s*)?tax/i;
  const totalPattern = /^(total|amount\s*due|balance\s*due|grand\s*total)/i;
  const skipPattern = /^(tip|gratuity|change|cash|credit|visa|mastercard|amex|card|thank|guest|server|table|check|order|date|time|tel|phone|fax|www|http|receipt)/i;

  // Pattern to extract a price from the end of a line: $12.99, 12.99, etc.
  const pricePattern = /\$?\s*(\d{1,6}\.\d{2})\s*$/;

  for (const line of lines) {
    const priceMatch = line.match(pricePattern);
    if (!priceMatch) continue;

    const price = parseFloat(priceMatch[1]);
    const name = line.slice(0, priceMatch.index).replace(/[\.\-\s]+$/, "").trim();

    if (!name || price <= 0) continue;

    if (subtotalPattern.test(name)) {
      subtotal = price;
    } else if (taxPattern.test(name)) {
      tax = price;
    } else if (totalPattern.test(name)) {
      total = price;
    } else if (!skipPattern.test(name)) {
      items.push({
        name,
        price,
        item_order: itemOrder++,
      });
    }
  }

  // If no subtotal was found, sum up the items
  if (subtotal === 0 && items.length > 0) {
    subtotal = items.reduce((sum, item) => sum + item.price, 0);
  }

  // If no total was found, compute it
  if (total === 0) {
    total = subtotal + tax;
  }

  return { line_items: items, subtotal, tax, total };
}
