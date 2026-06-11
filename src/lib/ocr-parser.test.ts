import { describe, it, expect } from "vitest";
import { parseReceiptText } from "./ocr-parser";

describe("parseReceiptText", () => {
  it("parses a Dinosaur Bar-B-Que-style receipt", () => {
    // Approximates what linesFromVisionWords produces for the Dinosaur
    // Bar-B-Que receipt photo the user reported: header/footer noise,
    // quantity-prefixed item names, bare "descriptor" lines under combo
    // items, and bleed-over/time-of-day strings that must not be treated
    // as line items.
    const rawText = [
      "Dinosaur Bar-B-Que Rochester",
      "We want to hear from you!",
      "Scan the QR code to give us your",
      "feedback!",
      "Server: Shannon F",
      "Check #441 Table 1",
      "Ordered: 12/12/25 6:43 PM",
      "1 Pepsi $3.50",
      "1 Diet Pepsi $3.50",
      "1 Maple Bourbon Smash $14.00",
      "1 Smokehouse Nachos $16.00",
      "Brisket",
      "1 3 Meat Combo $32.00",
      "Prime Brisket",
      "1 3 Meat Combo $32.00",
      "Prime Brisket",
      "2 Side Cornbread $4.00",
      "1 3 Meat Combo $32.00",
      "Prime Brisket",
      "2 Peanut Butter Pie $14.00",
      "1 Salted Caramel Cookie Bar $6.00",
      "1 Coffee $2.25",
      "Subtotal $159.25",
      "Tax $12.74",
      "Total $171.99",
      "Suggested Tip:",
      "18% (Tip $28.66 Total $200.65)",
      "20% (Tip $31.85 Total $203.84)",
      "22% (Tip $35.04 Total $207.03)",
      "Tip percentages are based on the check",
      "price before taxes.",
    ].join("\n");

    const parsed = parseReceiptText(rawText);

    expect(parsed.subtotal).toBe(159.25);
    expect(parsed.tax).toBe(12.74);
    expect(parsed.total).toBe(171.99);
    expect(parsed.warning).toBeUndefined();

    // Exactly 11 line items — nothing dropped, nothing duplicated.
    expect(parsed.line_items).toHaveLength(11);

    const names = parsed.line_items.map((i) => i.name);
    expect(names).toEqual([
      "Pepsi",
      "Diet Pepsi",
      "Maple Bourbon Smash",
      "Smokehouse Nachos (Brisket)",
      "3 Meat Combo (Prime Brisket)",
      "3 Meat Combo (Prime Brisket)",
      "Side Cornbread",
      "3 Meat Combo (Prime Brisket)",
      "Peanut Butter Pie",
      "Salted Caramel Cookie Bar",
      "Coffee",
    ]);

    const sum = parsed.line_items.reduce((s, i) => s + i.price, 0);
    expect(Math.abs(sum - parsed.subtotal)).toBeLessThan(0.01);
  });

  it("keeps the sum equal to the printed subtotal", () => {
    const rawText = [
      "1 Pepsi $3.50",
      "1 Diet Pepsi $3.50",
      "1 Maple Bourbon Smash $14.00",
      "1 Smokehouse Nachos $16.00",
      "Brisket",
      "1 3 Meat Combo $32.00",
      "Prime Brisket",
      "1 3 Meat Combo $32.00",
      "Prime Brisket",
      "2 Side Cornbread $4.00",
      "1 3 Meat Combo $32.00",
      "Prime Brisket",
      "2 Peanut Butter Pie $14.00",
      "1 Salted Caramel Cookie Bar $6.00",
      "1 Coffee $2.25",
      "Subtotal $159.25",
      "Tax $12.74",
      "Total $171.99",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    const sum = parsed.line_items.reduce((s, i) => s + i.price, 0);
    expect(Math.abs(sum - parsed.subtotal)).toBeLessThan(0.01);
    expect(parsed.warning).toBeUndefined();
  });

  it("skips date and time header lines that would otherwise pair with stray prices", () => {
    const rawText = [
      "12/12/25 6:43 PM",
      "$1.99",
      "1 Pepsi $3.50",
      "Subtotal $3.50",
      "Tax $0.28",
      "Total $3.78",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.line_items).toHaveLength(1);
    expect(parsed.line_items[0].name).toBe("Pepsi");
    expect(parsed.line_items[0].price).toBe(3.5);
    // The $1.99 bleed-over should not have been accepted.
    expect(parsed.line_items.some((i) => i.price === 1.99)).toBe(false);
  });

  it("strips leading quantity prefixes from item names", () => {
    const rawText = [
      "1 Pepsi $3.50",
      "2 Peanut Butter Pie $14.00",
      "1 3 Meat Combo $32.00",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.line_items.map((i) => i.name)).toEqual([
      "Pepsi",
      "Peanut Butter Pie",
      "3 Meat Combo",
    ]);
  });

  it("attaches descriptor lines to the previous item", () => {
    const rawText = [
      "1 Smokehouse Nachos $16.00",
      "Brisket",
      "1 3 Meat Combo $32.00",
      "Prime Brisket",
      "1 Coffee $2.25",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.line_items.map((i) => i.name)).toEqual([
      "Smokehouse Nachos (Brisket)",
      "3 Meat Combo (Prime Brisket)",
      "Coffee",
    ]);
  });

  it("drops footer noise after the Total line", () => {
    const rawText = [
      "1 Burger $10.00",
      "Subtotal $10.00",
      "Tax $0.80",
      "Total $10.80",
      "Suggested Tip:",
      "18% (Tip $1.80 Total $12.60)",
      "Tip percentages are based on the check",
      "price before taxes.",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.line_items).toHaveLength(1);
    expect(parsed.line_items[0].name).toBe("Burger");
    expect(parsed.subtotal).toBe(10);
    expect(parsed.tax).toBe(0.8);
    expect(parsed.total).toBe(10.8);
  });

  it("ignores tip and gratuity summary lines", () => {
    const rawText = [
      "1 Coffee $4.00",
      "Subtotal $4.00",
      "Tax $0.32",
      "Tip $1.00",
      "Gratuity $0.50",
      "Total $5.82",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.line_items).toHaveLength(1);
    expect(parsed.line_items[0].name).toBe("Coffee");
    expect(parsed.tax).toBe(0.32);
    expect(parsed.total).toBe(5.82);
  });

  it("falls back to summing items when the subtotal is missing", () => {
    const rawText = [
      "1 Coffee $2.25",
      "1 Bagel $3.50",
      "Tax $0.46",
      "Total $6.21",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.subtotal).toBeCloseTo(5.75, 2);
    expect(parsed.warning).toBeUndefined();
  });

  it("strips leading garbage characters from rows (bleed-over from adjacent receipts)", () => {
    // These are the three failure modes observed on the Vercel preview
    // after the bbox filter was fixed: a ")" character from a neighbouring
    // receipt bleeding into the start of the Subtotal and Coffee rows,
    // and a "1.99" decimal bleeding into the Pepsi row on the same y.
    const rawText = [
      "1.99 1 Pepsi $3.50",
      "1 Diet Pepsi $3.50",
      ") 1 Coffee $2.25",
      ") Subtotal $159.25",
      "Tax $12.74",
      "Total $171.99",
    ].join("\n");

    const parsed = parseReceiptText(rawText);

    expect(parsed.line_items.map((i) => i.name)).toEqual([
      "Pepsi",
      "Diet Pepsi",
      "Coffee",
    ]);
    expect(parsed.subtotal).toBe(159.25);
    expect(parsed.tax).toBe(12.74);
    expect(parsed.total).toBe(171.99);
    // The Subtotal row must not have become a line item.
    expect(
      parsed.line_items.some((i) => /sub\s*total/i.test(i.name))
    ).toBe(false);
  });

  it("strips leading digit-paren bleed ('03) ', '84 ) ') from item and summary rows", () => {
    // A neighbouring card receipt's totals ("0.03)", "0.55)", "0.84)") get
    // tokenised by Vision as a digit cluster plus a closing paren, and end
    // up glued to the start of several rows in the target receipt. The
    // Coffee row came out as "03 ) 1 Coffee $2.25" (the leading "03 " got
    // stripped as a quantity, leaving ") 1 Coffee" visible to the user),
    // and the Tax row came out as "84 ) Tax $12.74" (mis-classified as a
    // line item because it doesn't start with "Tax"). Both shapes should
    // now be handled up front by cleanLine.
    const rawText = [
      "1 Pepsi $3.50",
      "03 ) 1 Coffee $2.25",
      ") 03) Subtotal $159.25",
      "84) Tax $12.74",
      "55 ) Tax $12.74",
      "Total $171.99",
    ].join("\n");

    const parsed = parseReceiptText(rawText);

    // Only the two real items — Pepsi and Coffee — should land as items.
    expect(parsed.line_items.map((i) => i.name)).toEqual(["Pepsi", "Coffee"]);
    expect(parsed.subtotal).toBe(159.25);
    // Both Tax rows carry the same price; the first one wins, the second
    // is a duplicate that should NOT become a phantom item.
    expect(parsed.tax).toBe(12.74);
    expect(parsed.total).toBe(171.99);
    expect(
      parsed.line_items.some((i) => /tax/i.test(i.name))
    ).toBe(false);
    expect(
      parsed.line_items.some((i) => /sub\s*total/i.test(i.name))
    ).toBe(false);
  });

  it("new digit-paren bleed regex does not over-match digit-leading names", () => {
    // The digit-paren bleed regex (^\d+\s*[)\]}]+\s*) requires a closing
    // bracket to follow the digits. A name like "1 3 Meat Combo" or
    // "3 Cheese Quesadilla" has a space after the leading digits instead
    // of a bracket, so cleanLine must leave it alone. (stripLeadingQty
    // still peels one leading qty token — that's pre-existing behaviour.)
    // Meanwhile, the post-parse safety net must NOT run stripLeadingQty a
    // second time on "3 Meat Combo", which would turn it into "Meat Combo".
    const rawText = [
      "1 3 Meat Combo $32.00",
      "1 3 Meat Combo $32.00",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.line_items.map((i) => i.name)).toEqual([
      "3 Meat Combo",
      "3 Meat Combo",
    ]);
  });

  it("pairs a bare 'Tax' name row with a subsequent bare price row after the summary started", () => {
    // Bbox row grouping can split the Tax row into two logical lines
    // (name on one, price on the next) even after Subtotal has already
    // been seen. The pre-fix parser dropped the bare 'Tax' line under
    // the reachedSummary guard and then had no pending to pair the bare
    // price with — the receipt ended up with tax=0. The fix lets summary
    // keywords (Tax, Total, Subtotal) become pending even after the
    // summary has started.
    const rawText = [
      "1 Pepsi $3.50",
      "Subtotal $3.50",
      "Tax",
      "$0.28",
      "Total $3.78",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.line_items.map((i) => i.name)).toEqual(["Pepsi"]);
    expect(parsed.subtotal).toBe(3.5);
    expect(parsed.tax).toBe(0.28);
    expect(parsed.total).toBe(3.78);
  });

  it("derives tax from total - subtotal when the tax row is missing entirely", () => {
    // Last-resort safety net: if Subtotal and Total parse cleanly but
    // the Tax row was dropped somewhere upstream (bbox filter misfire,
    // unusual row ordering, etc.), derive tax from the math.
    const rawText = [
      "1 Pepsi $3.50",
      "Subtotal $3.50",
      "Total $3.78",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.subtotal).toBe(3.5);
    expect(parsed.tax).toBe(0.28);
    expect(parsed.total).toBe(3.78);
  });

  it("does not derive tax when the subtotal-to-total gap looks like a tip", () => {
    // If Total includes a tip (gap > 15% of subtotal), we should NOT
    // falsely promote it to tax.
    const rawText = [
      "1 Dinner $100.00",
      "Subtotal $100.00",
      "Total $120.00",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.subtotal).toBe(100);
    expect(parsed.tax).toBe(0);
    expect(parsed.total).toBe(120);
  });

  it("does not push the Subtotal row as an item even if leading junk survives cleanLine", () => {
    // Belt-and-suspenders for the post-parse safety net: if some weird
    // leading junk that cleanLine doesn't match still makes it to the
    // pushItem step, the post-parse sweep should promote it to the
    // subtotal field and drop it from the items list.
    const rawText = [
      "1 Pepsi $3.50",
      "** Subtotal $3.50",
      "** Tax $0.28",
      "** Total $3.78",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.line_items).toHaveLength(1);
    expect(parsed.line_items[0].name).toBe("Pepsi");
    expect(parsed.subtotal).toBe(3.5);
    expect(parsed.tax).toBe(0.28);
    expect(parsed.total).toBe(3.78);
  });

  describe("state-labelled tax lines", () => {
    // Many POS systems label the tax line with the state instead of (or in
    // addition to) the word "Tax" — e.g. TRATA in Rochester prints "NYS".
    // Reported scan: the NYS line was dropped entirely, tax came out $0.00,
    // and the derive-from-total safety net couldn't save it because the
    // Total row didn't parse cleanly either (subtotal === total on screen).
    // These cases deliberately omit a clean Total row so they exercise the
    // classifier itself, not the derive fallback.

    it("recognises 'NYS Tax' as the tax line", () => {
      const rawText = [
        "1 Burger $10.00",
        "Subtotal $10.00",
        "NYS Tax $0.89",
      ].join("\n");

      const parsed = parseReceiptText(rawText);
      expect(parsed.line_items).toHaveLength(1);
      expect(parsed.tax).toBe(0.89);
      expect(parsed.total).toBe(10.89);
    });

    it("recognises 'NYS Sales Tax 8.875%' as the tax line", () => {
      const rawText = [
        "1 Burger $10.00",
        "Subtotal $10.00",
        "NYS Sales Tax 8.875% $0.89",
      ].join("\n");

      const parsed = parseReceiptText(rawText);
      expect(parsed.line_items).toHaveLength(1);
      expect(parsed.tax).toBe(0.89);
    });

    it("recognises a bare 'NYS' label as the tax line", () => {
      // The TRATA receipt: items, then "NYS" with the tax amount and no
      // "Tax" word anywhere on the row.
      const rawText = [
        "1 Carletto Pinot Grigio $22.00",
        "2 TRATA Smashburger $34.00",
        "Subtotal $56.00",
        "NYS $4.97",
      ].join("\n");

      const parsed = parseReceiptText(rawText);
      expect(parsed.line_items).toHaveLength(2);
      expect(parsed.subtotal).toBe(56);
      expect(parsed.tax).toBe(4.97);
      expect(parsed.total).toBe(60.97);
      expect(parsed.line_items.some((i) => /nys/i.test(i.name))).toBe(false);
    });

    it("recognises a bare 'NYS' tax row even when the Total includes a tip", () => {
      // Tip-inclusive totals defeat the ≤15% derive guard, so the NYS row
      // itself must be classified as tax.
      const rawText = [
        "1 Carletto Pinot Grigio $22.00",
        "2 TRATA Smashburger $34.00",
        "Subtotal $56.00",
        "NYS $4.97",
        "Total $72.97",
      ].join("\n");

      const parsed = parseReceiptText(rawText);
      expect(parsed.tax).toBe(4.97);
      expect(parsed.total).toBe(72.97);
    });

    it("recognises other states' abbreviation + percentage labels", () => {
      // "across multiple states": e.g. Washington prints "WA 10.25%",
      // California "CA 8.5%".
      const rawText = [
        "1 Burger $10.00",
        "Subtotal $10.00",
        "WA 10.25% $1.03",
      ].join("\n");

      const parsed = parseReceiptText(rawText);
      expect(parsed.line_items).toHaveLength(1);
      expect(parsed.tax).toBe(1.03);
    });

    it("recognises 'State Tax' and 'City Tax' rows, keeping the combined amount", () => {
      const rawText = [
        "1 Burger $10.00",
        "Subtotal $10.00",
        "State Tax $0.40",
        "City Tax $0.20",
      ].join("\n");

      const parsed = parseReceiptText(rawText);
      expect(parsed.line_items).toHaveLength(1);
      // Two distinct tax rows should sum, not overwrite.
      expect(parsed.tax).toBeCloseTo(0.6, 2);
      expect(parsed.total).toBe(10.6);
    });

    it("pairs a bare 'NYS' name row with the price on the following row", () => {
      // Same two-column bbox split already handled for "Tax".
      const rawText = [
        "1 Burger $10.00",
        "Subtotal $10.00",
        "NYS",
        "$0.89",
      ].join("\n");

      const parsed = parseReceiptText(rawText);
      expect(parsed.tax).toBe(0.89);
    });

    it("does NOT treat 'NY Strip Steak' or promo percent lines as tax", () => {
      const rawText = [
        "1 NY Strip Steak $45.00",
        "Subtotal $45.00",
        "NYS Tax $4.00",
        "Total $49.00",
        "Get 10% off your next visit",
      ].join("\n");

      const parsed = parseReceiptText(rawText);
      expect(parsed.line_items.map((i) => i.name)).toEqual(["NY Strip Steak"]);
      expect(parsed.tax).toBe(4);
      expect(parsed.total).toBe(49);
    });
  });

  it("flags a warning when items do not add up to the subtotal", () => {
    // Third item goes missing — this is the failure mode we want the UI
    // to surface via the amber banner.
    const rawText = [
      "1 Coffee $2.25",
      "1 Bagel $3.50",
      "Subtotal $10.00",
      "Tax $0.80",
      "Total $10.80",
    ].join("\n");

    const parsed = parseReceiptText(rawText);
    expect(parsed.warning).toMatch(/don't quite match/);
  });
});
