import { NextRequest, NextResponse } from "next/server";
import { parseReceiptText } from "@/lib/ocr-parser";
import { linesFromVisionWords, type VisionWord } from "@/lib/ocr-lines";

// The endpoint is unauthenticated and forwards to a paid Google API; an
// 8 MB cap keeps a single request from burning a large Vision quota and
// matches what the client-side compressor in CameraCapture produces with
// generous headroom (1200px JPEG @ q=0.8 is typically <1 MB).
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!file.type || !file.type.toLowerCase().startsWith("image/")) {
      return NextResponse.json(
        { error: "invalid_file", message: "Only image uploads are supported" },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "file_too_large", message: "Image must be under 8 MB" },
        { status: 413 }
      );
    }

    // Convert file to base64 for Vision API
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ocr_not_configured", message: "OCR service is not configured" },
        { status: 503 }
      );
    }

    // Call Google Cloud Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const body = await visionResponse.text();
      console.error(
        `Vision API error: status=${visionResponse.status} body=${body}`
      );
      let upstreamMessage = "";
      try {
        const parsed = JSON.parse(body);
        upstreamMessage = parsed?.error?.message ?? "";
      } catch {
        // body was not JSON — fall through to generic message
      }
      return NextResponse.json(
        {
          error: "ocr_failed",
          message: upstreamMessage
            ? `Vision API: ${upstreamMessage}`
            : `Vision API request failed (${visionResponse.status})`,
        },
        { status: 502 }
      );
    }

    const visionData = await visionResponse.json();

    // Vision can signal failure inside a 200 response via responses[0].error.
    const upstreamError = visionData.responses?.[0]?.error;
    if (upstreamError) {
      console.error("Vision API returned per-request error:", upstreamError);
      return NextResponse.json(
        {
          error: "ocr_failed",
          message: `Vision API: ${upstreamError.message ?? "unknown error"}`,
        },
        { status: 502 }
      );
    }

    const textAnnotations = visionData.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return NextResponse.json(
        { error: "ocr_failed", message: "No text detected in image" },
        { status: 200 }
      );
    }

    const rawText: string = textAnnotations[0].description ?? "";
    // Per-word annotations (element [0] is the full concatenation, the rest
    // are individual words with bounding polys). Using word-level data lets
    // us rebuild proper rows instead of trusting Vision's line ordering.
    const words: VisionWord[] = textAnnotations.slice(1);
    const reconstructed = words.length > 0 ? linesFromVisionWords(words) : "";

    // Try the bbox-reconstructed input first. If it yields zero items —
    // which can happen when bleed-over filtering misidentifies the name
    // column, or when the receipt layout doesn't lend itself to spatial
    // row grouping — fall back to Vision's native line ordering so we
    // degrade to the pre-refactor behaviour instead of showing nothing.
    let parsed = parseReceiptText(
      reconstructed.trim().length > 0 ? reconstructed : rawText
    );
    let usedFallback = false;
    if (parsed.line_items.length === 0 && reconstructed.trim().length > 0 && rawText) {
      const fallback = parseReceiptText(rawText);
      if (fallback.line_items.length > 0) {
        parsed = fallback;
        usedFallback = true;
      }
    }

    if (parsed.line_items.length === 0) {
      console.error(
        `OCR parse returned zero items. rawText:\n${rawText}\nreconstructed:\n${reconstructed}`
      );
      return NextResponse.json(
        { error: "ocr_failed", message: "Could not parse receipt items", rawText },
        { status: 200 }
      );
    }

    if (usedFallback) {
      console.warn(
        `OCR parse used rawText fallback (bbox reconstruction returned no items). reconstructed:\n${reconstructed}`
      );
    }
    if (parsed.warning) {
      console.warn(
        `OCR parse warning: ${parsed.warning}\nrawText:\n${rawText}\nreconstructed:\n${reconstructed}`
      );
    }

    return NextResponse.json({
      line_items: parsed.line_items,
      subtotal: parsed.subtotal,
      tax: parsed.tax,
      total: parsed.total,
      warning: parsed.warning,
      rawText,
    });
  } catch (err) {
    console.error("OCR route unexpected error:", err);
    return NextResponse.json(
      { error: "ocr_failed", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
