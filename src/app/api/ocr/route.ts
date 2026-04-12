import { NextRequest, NextResponse } from "next/server";
import { parseReceiptText } from "@/lib/ocr-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
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
      return NextResponse.json(
        { error: "ocr_failed", message: "Vision API request failed" },
        { status: 502 }
      );
    }

    const visionData = await visionResponse.json();
    const textAnnotations = visionData.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return NextResponse.json(
        { error: "ocr_failed", message: "No text detected in image" },
        { status: 200 }
      );
    }

    const rawText = textAnnotations[0].description;
    const parsed = parseReceiptText(rawText);

    if (parsed.line_items.length === 0) {
      return NextResponse.json(
        { error: "ocr_failed", message: "Could not parse receipt items", rawText },
        { status: 200 }
      );
    }

    return NextResponse.json({
      line_items: parsed.line_items,
      subtotal: parsed.subtotal,
      tax: parsed.tax,
      total: parsed.total,
      rawText,
    });
  } catch {
    return NextResponse.json(
      { error: "ocr_failed", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
