// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  stashPendingReceiptPhoto,
  attachPendingReceiptPhoto,
  getReceiptPhotoDataUrl,
  receiptPhotoFilename,
} from "./receipt-photo";

beforeEach(() => {
  sessionStorage.clear();
});

describe("receipt photo stash", () => {
  // The camera capture <input> doesn't add the photo to the camera roll, so
  // once the paper receipt is tossed the image is gone unless we keep it
  // around for the user to save.

  it("round-trips a captured photo from pending to a receipt id", async () => {
    const photo = new Blob(["fake-jpeg-bytes"], { type: "image/jpeg" });
    await stashPendingReceiptPhoto(photo);
    attachPendingReceiptPhoto("r1");

    const dataUrl = getReceiptPhotoDataUrl("r1");
    expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("exposes the pending photo before a receipt exists (OCR-failure path)", async () => {
    const photo = new Blob(["fake-jpeg-bytes"], { type: "image/jpeg" });
    await stashPendingReceiptPhoto(photo);

    expect(getReceiptPhotoDataUrl(null)).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("clears the pending slot once attached, so it can't leak onto the next receipt", async () => {
    const photo = new Blob(["fake-jpeg-bytes"], { type: "image/jpeg" });
    await stashPendingReceiptPhoto(photo);
    attachPendingReceiptPhoto("r1");

    expect(getReceiptPhotoDataUrl(null)).toBeNull();
    attachPendingReceiptPhoto("r2");
    expect(getReceiptPhotoDataUrl("r2")).toBeNull();
  });

  it("returns null when nothing was stashed", () => {
    expect(getReceiptPhotoDataUrl("missing")).toBeNull();
    expect(getReceiptPhotoDataUrl(null)).toBeNull();
  });

  it("attach without a pending photo is a no-op (manual entry without a scan)", () => {
    attachPendingReceiptPhoto("r1");
    expect(getReceiptPhotoDataUrl("r1")).toBeNull();
  });
});

describe("receiptPhotoFilename", () => {
  it("names the file with the scan date and time", () => {
    const scannedAt = new Date(2026, 5, 11, 19, 30).getTime();
    expect(receiptPhotoFilename(scannedAt)).toBe(
      "divvy-receipt-2026-06-11-1930.jpg"
    );
  });

  it("zero-pads single-digit fields", () => {
    const scannedAt = new Date(2026, 0, 2, 9, 5).getTime();
    expect(receiptPhotoFilename(scannedAt)).toBe(
      "divvy-receipt-2026-01-02-0905.jpg"
    );
  });
});
