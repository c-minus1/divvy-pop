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
});
