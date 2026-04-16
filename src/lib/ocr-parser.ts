import type { LineItem } from "@/types";

export interface ParsedReceipt {
  line_items: Omit<LineItem, "id">[];
  subtotal: number;
  tax: number;
  total: number;
  /** Non-fatal warning for the UI when the parse looks inconsistent. */
  warning?: string;
}

type LineKind = "subtotal" | "tax" | "total" | "skip" | "item";

// Patterns for summary lines (subtotal, tax, total, tip, etc.)
const subtotalPattern = /^(sub\s*total|subtotal)/i;
const taxPattern = /^(sales\s*)?tax\b/i;
const totalPattern = /^(total|amount\s*due|balance\s*due|grand\s*total)/i;
const skipPattern =
  /^(tip|gratuity|change|cash|credit|visa|mastercard|amex|card|thank|guest|server|table|check|order|date|time|tel|phone|fax|www|http|receipt|suggested)/i;

// Date like 12/12/25 or 12-12-2025, anywhere in the line.
const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/;
// Time like 6:43, 6:43 PM, 18:43.
const timePattern = /\b\d{1,2}:\d{2}(?:\s*[ap]\.?m\.?)?\b/i;

// Price at the end of a line: $12.99, 12.99, 1,234.99, etc.
const pricePattern = /\$?\s*(\d{1,6}(?:,\d{3})*\.\d{2})\s*$/;

function classify(name: string): LineKind {
  if (subtotalPattern.test(name)) return "subtotal";
  if (totalPattern.test(name)) return "total";
  if (taxPattern.test(name)) return "tax";
  if (skipPattern.test(name)) return "skip";
  if (datePattern.test(name) || timePattern.test(name)) return "skip";
  return "item";
}

// Strip a leading integer quantity token from an item name. Turns
// "1 3 Meat Combo" into "3 Meat Combo" and "2 Peanut Butter Pie" into
// "Peanut Butter Pie". Requires a space after the digit so we don't chew
// into names that legitimately start with a number-word (e.g. "3 Cheese
// Quesadilla" — if that's the actual menu name there's nothing to strip
// since there's no leading qty anyway; worst case we turn "3 Cheese" into
// "Cheese", which the user can edit).
// Strip leading noise characters ("(", ")", "|", "*", etc.), leading bare
// decimal bleed-over ("1.99 "), and leading digit-cluster + closing-bracket
// bleed ("03) ", "84 ) ") from a reconstructed line. Stray text from a
// neighbouring receipt photographed alongside the target receipt gets glued
// to the start of rows when bbox grouping collects same-y words together;
// we want those gone before we try to classify the line or extract a name.
// The strips run in a loop so stacked bleed tokens (e.g. ") 03) ") get
// peeled off in a single pass.
function cleanLine(line: string): string {
  let prev: string;
  let cur = line;
  do {
    prev = cur;
    cur = cur
      // Leading non-word chars: ")", "*", "|", etc.
      .replace(/^[^\w$]+/, "")
      // Leading bare decimal bleed: "1.99 " before the real line.
      .replace(/^\d+\.\d{2}\s+(?=\S)/, "")
      // Leading digit cluster + closing bracket/paren bleed: "03) ",
      // "84 ) ", "55]" — tail-end fragments of totals from a
      // neighbouring receipt like "0.03)" that Vision tokenised as
      // "03" + ")".
      .replace(/^\d+\s*[)\]}]+\s*/, "")
      .trim();
  } while (cur !== prev);
  return cur;
}

function stripLeadingQty(name: string): string {
  return name.replace(/^(\d+)\s+(?=\S)/, "");
}

function looksLikeDescriptor(name: string): boolean {
  if (!name) return false;
  if (name.length > 40) return false;
  // Descriptors are text-y — shouldn't start with a digit or punctuation.
  if (!/^[A-Za-z]/.test(name)) return false;
  // Avoid swallowing something that clearly wants its own price.
  if (pricePattern.test(name)) return false;
  return true;
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

  // Once we hit subtotal/tax/total we're in the summary/footer of the
  // receipt. Stop accumulating items after that point so footer noise
  // ("Tip percentages are based on the check price before taxes.", etc.)
  // doesn't leak into line items.
  let reachedSummary = false;

  const pushItem = (rawName: string, price: number) => {
    const name = stripLeadingQty(rawName);
    if (!name) return;
    items.push({ name, price, item_order: itemOrder++ });
  };

  const apply = (name: string, price: number, kind: LineKind) => {
    if (price <= 0) return;
    if (kind === "subtotal") subtotal = price;
    else if (kind === "tax") tax = price;
    else if (kind === "total") total = price;
    else if (kind === "item") pushItem(name, price);
    // kind === "skip" is intentionally dropped
  };

  // When a pending line is about to be discarded, try to salvage it as a
  // descriptor attached to the most recently pushed item — e.g. the
  // "Prime Brisket" meat choice printed under each "3 Meat Combo".
  const salvagePending = () => {
    if (!pending) return;
    if (pending.kind !== "item") return;
    if (items.length === 0) return;
    if (!looksLikeDescriptor(pending.name)) return;
    const last = items[items.length - 1];
    last.name = `${last.name} (${pending.name})`;
  };

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;
    const priceMatch = line.match(pricePattern);

    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ""));
      const name = line
        .slice(0, priceMatch.index)
        .replace(/[.\-\s]+$/, "")
        .trim();

      if (name) {
        const kind = classify(name);
        if (
          kind === "subtotal" ||
          kind === "tax" ||
          kind === "total"
        ) {
          // Entering summary — discard any dangling pending.
          pending = null;
          reachedSummary = true;
          apply(name, price, kind);
        } else if (!reachedSummary) {
          // Single-line "Name ... $price" — the pending was a stray
          // descriptor, salvage it onto the previous item first.
          salvagePending();
          pending = null;
          apply(name, price, kind);
        }
        // else: orphan priced line after summary (e.g. "20% ($203.84)") — drop.
      } else if (pending && !reachedSummary) {
        // Standalone price line; pair with the most recent pending name.
        apply(pending.name, price, pending.kind);
        pending = null;
      }
      // else: orphan price line with no candidate name — drop.
      continue;
    }

    // Non-priced lines past the summary are footer noise — drop them.
    if (reachedSummary) continue;

    // No price on this line — it's a name candidate (or something to skip).
    const kind = classify(line);
    if (kind === "skip") {
      // A skip line breaks any continuation chain; drop the pending so it
      // doesn't accidentally attach to an item across a header.
      pending = null;
      continue;
    }

    // Replacing a pending — the old one was never paired with a price,
    // so salvage it as a descriptor if possible.
    if (pending) salvagePending();
    pending = { name: line, kind };
  }

  // Flush a trailing pending (descriptor after the last priced item).
  if (pending) salvagePending();

  // Safety net: if any pushed item's name still classifies as a summary
  // keyword (because leading junk confused the in-loop classifier), pull
  // it out of the items list and promote it to the matching summary field.
  // This catches e.g. a ") Subtotal $159.25" row that squeaked past
  // cleanLine with some other garbage we didn't anticipate. Additionally,
  // if cleanLine can scrub the stored name (e.g. ") 1 Coffee" → "Coffee"),
  // write the scrubbed version back so the review screen doesn't show the
  // leading junk — this is the belt to cleanLine's braces for any bleed
  // shapes that slipped past the in-loop cleanup.
  for (let i = items.length - 1; i >= 0; i--) {
    const precleaned = cleanLine(items[i].name);
    // Only re-run stripLeadingQty if cleanLine actually peeled something
    // off — otherwise we'd chew a second "quantity" off names like
    // "3 Meat Combo" that the main loop already stripped correctly (from
    // an original "1 3 Meat Combo").
    const cleaned =
      precleaned !== items[i].name ? stripLeadingQty(precleaned) : precleaned;
    const kind = classify(cleaned);
    if (kind === "subtotal" || kind === "tax" || kind === "total") {
      const { price } = items[i];
      items.splice(i, 1);
      if (kind === "subtotal" && subtotal === 0) subtotal = price;
      else if (kind === "tax" && tax === 0) tax = price;
      else if (kind === "total" && total === 0) total = price;
    } else if (cleaned && cleaned !== items[i].name) {
      items[i].name = cleaned;
    }
  }
  // Re-number item_order so the indices stay contiguous after removals.
  items.forEach((item, idx) => {
    item.item_order = idx;
  });

  // If no subtotal was found, sum up the items
  if (subtotal === 0 && items.length > 0) {
    subtotal = items.reduce((sum, item) => sum + item.price, 0);
  }

  // If no total was found, compute it
  if (total === 0) {
    total = subtotal + tax;
  }

  // Penny-level sum check. If items don't add up to the printed subtotal we
  // can't trust the scan — flag it so the UI can warn the user.
  let warning: string | undefined;
  if (items.length > 0 && subtotal > 0) {
    const sum = items.reduce((s, i) => s + i.price, 0);
    if (Math.abs(sum - subtotal) > 0.02) {
      warning =
        "The scanned items don't quite match the subtotal. Double-check before continuing.";
    }
  }

  return { line_items: items, subtotal, tax, total, warning };
}
