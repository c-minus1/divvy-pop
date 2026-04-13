import { describe, it, expect } from "vitest";
import { linesFromVisionWords, type VisionWord } from "./ocr-lines";

// Build a Vision-style word with a simple axis-aligned bounding box.
function word(text: string, x: number, y: number, w = 40, h = 20): VisionWord {
  return {
    description: text,
    boundingPoly: {
      vertices: [
        { x, y },
        { x: x + w, y },
        { x: x + w, y: y + h },
        { x, y: y + h },
      ],
    },
  };
}

describe("linesFromVisionWords", () => {
  it("groups words on the same visual row in left-to-right order", () => {
    const words: VisionWord[] = [
      // Second row, out of order.
      word("Diet", 100, 140),
      word("Pepsi", 160, 140),
      word("$3.50", 400, 140),
      // First row.
      word("Pepsi", 100, 100),
      word("$3.50", 400, 100),
      // Third row.
      word("Coffee", 100, 180),
      word("$2.25", 400, 180),
    ];

    const out = linesFromVisionWords(words);
    expect(out.split("\n")).toEqual([
      "Pepsi $3.50",
      "Diet Pepsi $3.50",
      "Coffee $2.25",
    ]);
  });

  it("drops bleed-over words that sit far left of the dominant name column", () => {
    // Main receipt's name column is at x=100; prices at x=400.
    // A neighbouring receipt leaks "$1.99" at x=-200 on one row.
    const words: VisionWord[] = [
      word("Date:", 100, 60),
      word("12/12/25", 160, 60),
      word("$1.99", -200, 60), // bleed-over — should be dropped
      word("Pepsi", 100, 100),
      word("$3.50", 400, 100),
      word("Diet", 100, 140),
      word("Pepsi", 160, 140),
      word("$3.50", 400, 140),
      word("Coffee", 100, 180),
      word("$2.25", 400, 180),
      word("Subtotal", 100, 220),
      word("$9.25", 400, 220),
    ];

    const out = linesFromVisionWords(words);
    expect(out).not.toContain("$1.99");
    // First row should still show the date — just without the leaked price.
    expect(out.split("\n")[0]).toBe("Date: 12/12/25");
  });

  it("handles words whose centers are off by a small amount (tolerance)", () => {
    // Two items on the same visual row where the price's bounding box is
    // a couple of pixels higher/lower than the name's.
    const words: VisionWord[] = [
      word("Pepsi", 100, 100, 50, 20),
      word("$3.50", 400, 103, 60, 18),
      word("Coffee", 100, 150, 60, 20),
      word("$2.25", 400, 149, 60, 20),
    ];

    const out = linesFromVisionWords(words);
    expect(out.split("\n")).toEqual(["Pepsi $3.50", "Coffee $2.25"]);
  });

  it("returns an empty string when given no words", () => {
    expect(linesFromVisionWords([])).toBe("");
  });

  it("does not drop name words when the price column is denser than the name column", () => {
    // Regression for the Vercel preview bug: on a two-column receipt,
    // prices line up at *exactly* the same left-edge on every row while
    // name first-words get jittered a few pixels left and right by Vision.
    // The old heuristic picked the densest bucket as the "name column",
    // which was actually the price column — so every name word was
    // filtered as "bleed-over" and the parser got rows of bare prices.
    const words: VisionWord[] = [];
    const names = [
      "1 Pepsi",
      "1 Diet Pepsi",
      "1 Maple Bourbon Smash",
      "1 Smokehouse Nachos",
      "1 3 Meat Combo",
      "1 3 Meat Combo",
      "2 Side Cornbread",
      "1 3 Meat Combo",
      "2 Peanut Butter Pie",
      "1 Salted Caramel Cookie Bar",
      "1 Coffee",
    ];
    const nameLeftJitter = [0, 4, -3, 2, -1, 5, -4, 1, 3, -2, 0];
    names.forEach((n, i) => {
      const parts = n.split(" ");
      parts.forEach((p, j) => {
        // Different x for each part, jittered per row so the
        // first-word-column bucket doesn't accumulate all 11 hits.
        const baseX = 100 + nameLeftJitter[i];
        words.push(word(p, baseX + j * 55, 100 + i * 40, 45, 20));
      });
      // Price column is rock-steady at x=800 — 11 words in one bucket,
      // the densest single left-edge cluster in the image.
      words.push(word("$3.50", 800, 100 + i * 40, 50, 20));
    });

    const out = linesFromVisionWords(words);
    const lines = out.split("\n");
    expect(lines.length).toBe(names.length);
    // Every row must still carry both the item name text AND the price.
    for (let i = 0; i < lines.length; i++) {
      expect(lines[i]).toContain("$3.50");
    }
    expect(lines[0]).toContain("Pepsi");
    expect(lines[3]).toContain("Smokehouse");
    expect(lines[6]).toContain("Cornbread");
    expect(lines[lines.length - 1]).toContain("Coffee");
  });

  it("drops bleed-over when it is small relative to the main receipt", () => {
    // Small scattered fragments on the far left of the image (neighbour
    // receipt) should be filtered out — they don't form a substantial
    // column so they never become the leftmost "name column".
    const words: VisionWord[] = [];
    // Leftmost fragments: 4 isolated words, each in its own bucket area.
    words.push(word("1", -200, 60, 10, 20));
    words.push(word("PM", -190, 100, 20, 20));
    words.push(word("d)", -205, 140, 15, 20));
    words.push(word("540", -195, 180, 25, 20));

    // Main receipt: 10 rows at x=100 name column, x=500 price column.
    for (let i = 0; i < 10; i++) {
      words.push(word("Item", 100, 220 + i * 40, 40, 20));
      words.push(word(`Name${i}`, 160, 220 + i * 40, 60, 20));
      words.push(word("$5.00", 500, 220 + i * 40, 50, 20));
    }

    const out = linesFromVisionWords(words);
    expect(out).not.toContain(" PM ");
    expect(out).not.toMatch(/^1\s/m);
    expect(out).not.toContain("d)");
    expect(out).not.toContain("540");
    // And the real content is still there.
    expect(out).toContain("$5.00");
    expect(out).toContain("Name0");
  });
});
