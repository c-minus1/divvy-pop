import type { LineItem } from "@/types";

export interface ParsedReceipt {
  line_items: Omit<LineItem, "id">[];
  subtotal: number;
  tax: number;
  total: number;
}

type LineKind = "subtotal" | "tax" | "total" | "skip" | "item";

// Patterns for summary lines (subtotal, tax, total, tip, etc.)
const subtotalPattern = /^(sub\s*total|subtotal)/i;
const taxPattern = /^(sales\s*)?tax/i;
const totalPattern = /^(total|amount\s*due|balance\s*due|grand\s*total)/i;
const skipPattern = /^(tip|gratuity|change|cash|credit|visa|mastercard|amex|card|thank|guest|server|table|check|order|date|time|tel|phone|fax|www|http|receipt)/i;

// Price at the end of a line: $12.99, 12.99, 1,234.99, etc.
const pricePattern = /\$?\s*(\d{1,6}(?:,\d{3})*\.\d{2})\s*$/;

function classify(name: string): LineKind {
  if (subtotalPattern.test(name)) return "subtotal";
  if (totalPattern.test(name)) return "total";
  if (taxPattern.test(name)) return "tax";
  if (skipPattern.test(name)) return "skip";
  return "item";
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  const items: Omit<LineItem, "id">[] = [];
  let subtotal = 0;
  let tax = 0;
  let total = 0;
  let itemOrder = 0;

  // Candidate name from a previous line that had no price on it. Two-column
  // receipts (item left, price right-aligned) often come out of Vision with
  // the name and price on consecutive lines.
  let pending: { name: string; kind: LineKind } | null = null;

  const apply = (name: string, price: number, kind: LineKind) => {
    if (price <= 0) return;
    if (kind === "subtotal") subtotal = price;
    else if (kind === "tax") tax = price;
    else if (kind === "total") total = price;
    else if (kind === "item") {
      items.push({ name, price, item_order: itemOrder++ });
    }
    // kind === "skip" is intentionally dropped
  };

  for (const line of lines) {
    const priceMatch = line.match(pricePattern);

    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ""));
      const name = line
        .slice(0, priceMatch.index)
        .replace(/[.\-\s]+$/, "")
        .trim();

      if (name) {
        // Single-line "Name ... $price" — process directly.
        apply(name, price, classify(name));
        pending = null;
      } else if (pending) {
        // Standalone price line; pair with the most recent pending name.
        apply(pending.name, price, pending.kind);
        pending = null;
      }
      // else: orphan price line with no candidate name — drop.
      continue;
    }

    // No price on this line — it's a name candidate (or something to skip).
    const kind = classify(line);
    if (kind === "skip") {
      pending = null;
      continue;
    }
    pending = { name: line, kind };
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
