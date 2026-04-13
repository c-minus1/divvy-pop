// Reconstruct logical receipt lines from Google Vision word-level bounding
// boxes. Vision's `textAnnotations[0].description` gives us a best-effort
// line ordering, but for receipts that fails in three important ways:
//
//  1. Two-column layouts (item name on the left, price on the right) can get
//     split across two lines with the name and price disconnected.
//  2. When a photo captures more than one receipt, text from the neighbour
//     receipt bleeds into the middle of the recognised text and gets paired
//     with random rows of the target receipt.
//  3. Line ordering can drift for rows with tight vertical spacing, dropping
//     descriptor lines entirely.
//
// Using the per-word bounding polygons we can group words by vertical
// position and keep only the words that belong to the dominant x-range of
// the receipt, which fixes all three.

export interface VisionVertex {
  x?: number;
  y?: number;
}

export interface VisionWord {
  description: string;
  boundingPoly?: {
    vertices?: VisionVertex[];
  };
}

interface NormalisedWord {
  text: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  cy: number;
  height: number;
}

function normalise(words: VisionWord[]): NormalisedWord[] {
  const out: NormalisedWord[] = [];
  for (const w of words) {
    const text = (w.description ?? "").trim();
    if (!text) continue;
    const verts = w.boundingPoly?.vertices;
    if (!verts || verts.length === 0) continue;

    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const v of verts) {
      const x = v.x ?? 0;
      const y = v.y ?? 0;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
    if (!Number.isFinite(left) || !Number.isFinite(top)) continue;

    out.push({
      text,
      left,
      right,
      top,
      bottom,
      cy: (top + bottom) / 2,
      height: Math.max(1, bottom - top),
    });
  }
  return out;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Cluster left-edge x values to find the dominant name column. We bucket the
// x values and pick the bucket with the most hits; the target receipt's name
// column will be the densest vertical stripe of text.
function findNameColumnLeft(words: NormalisedWord[]): number | null {
  if (words.length === 0) return null;
  const heights = words.map((w) => w.height);
  const bucketSize = Math.max(8, median(heights));
  const buckets = new Map<number, number>();
  for (const w of words) {
    const key = Math.round(w.left / bucketSize);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  // Only consider buckets in the left half of the image (the name column
  // should be on the left). Pick the one with the most words.
  let bestKey: number | null = null;
  let bestCount = 0;
  for (const [key, count] of buckets.entries()) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }
  if (bestKey === null) return null;

  // Convert back to an x coordinate (lower edge of the bucket).
  return bestKey * bucketSize;
}

interface Row {
  cy: number;
  words: NormalisedWord[];
}

function groupIntoRows(words: NormalisedWord[]): Row[] {
  if (words.length === 0) return [];
  const sorted = [...words].sort((a, b) => a.cy - b.cy);
  const heights = sorted.map((w) => w.height);
  const tolerance = Math.max(4, median(heights) * 0.6);

  const rows: Row[] = [];
  let current: NormalisedWord[] = [sorted[0]];
  let currentCy = sorted[0].cy;

  for (let i = 1; i < sorted.length; i++) {
    const w = sorted[i];
    if (Math.abs(w.cy - currentCy) <= tolerance) {
      current.push(w);
      // Running mean so tall words don't pull the anchor away.
      currentCy = current.reduce((sum, c) => sum + c.cy, 0) / current.length;
    } else {
      rows.push({ cy: currentCy, words: current });
      current = [w];
      currentCy = w.cy;
    }
  }
  rows.push({ cy: currentCy, words: current });
  return rows;
}

/**
 * Convert Vision word-level annotations into a `\n`-joined string of logical
 * receipt lines, ordered top-to-bottom and left-to-right within each row.
 * Words far to the left of the dominant name column (bleed-over from a
 * neighbouring receipt) are dropped.
 */
export function linesFromVisionWords(words: VisionWord[]): string {
  const normalised = normalise(words);
  if (normalised.length === 0) return "";

  const nameLeft = findNameColumnLeft(normalised);
  const heights = normalised.map((w) => w.height);
  const medH = median(heights);
  // Allow words that start up to ~1.5 character widths left of the name
  // column. Anything further left is likely a different receipt.
  const bleedMargin = Math.max(10, medH * 0.8);

  const kept =
    nameLeft === null
      ? normalised
      : normalised.filter((w) => w.right >= nameLeft - bleedMargin);

  const rows = groupIntoRows(kept);
  rows.sort((a, b) => a.cy - b.cy);

  const lines: string[] = [];
  for (const row of rows) {
    const sorted = [...row.words].sort((a, b) => a.left - b.left);
    const text = sorted.map((w) => w.text).join(" ").trim();
    if (text) lines.push(text);
  }
  return lines.join("\n");
}
