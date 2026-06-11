// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import SaveReceiptPhoto from "./SaveReceiptPhoto";
import {
  stashPendingReceiptPhoto,
  attachPendingReceiptPhoto,
} from "@/lib/receipt-photo";

beforeEach(() => {
  sessionStorage.clear();
});
afterEach(cleanup);

const scannedAt = new Date(2026, 5, 11, 19, 30).getTime();

describe("SaveReceiptPhoto", () => {
  it("renders nothing when no photo is available for the receipt", () => {
    const { container } = render(
      <SaveReceiptPhoto receiptId="r1" scannedAt={scannedAt} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("offers a download link for the captured photo", async () => {
    const photo = new Blob(["fake-jpeg-bytes"], { type: "image/jpeg" });
    await stashPendingReceiptPhoto(photo);
    attachPendingReceiptPhoto("r1");

    render(<SaveReceiptPhoto receiptId="r1" scannedAt={scannedAt} />);

    const link = await screen.findByRole("link", { name: /save photo/i });
    expect(link.getAttribute("href")).toMatch(/^data:image\/jpeg;base64,/);
    expect(link.getAttribute("download")).toBe(
      "divvy-receipt-2026-06-11-1930.jpg"
    );
  });

  it("offers the still-pending photo when no receipt exists yet (OCR failed)", async () => {
    const photo = new Blob(["fake-jpeg-bytes"], { type: "image/jpeg" });
    await stashPendingReceiptPhoto(photo);

    render(<SaveReceiptPhoto receiptId={null} scannedAt={scannedAt} />);

    const link = await screen.findByRole("link", { name: /save photo/i });
    expect(link.getAttribute("href")).toMatch(/^data:image\/jpeg;base64,/);
  });
});
