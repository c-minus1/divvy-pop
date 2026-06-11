// Keeps the captured receipt photo available through the scan → review flow
// so the user can save it to their device. The camera-capture <input> doesn't
// add the photo to the camera roll, so without this the image is gone the
// moment the paper receipt is. Stored as a data URL in sessionStorage —
// best-effort: quota or private-mode failures just mean the save link won't
// appear.

const PENDING_KEY = "divvy:receipt-photo:pending";
const keyFor = (receiptId: string) => `divvy:receipt-photo:${receiptId}`;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Stash the just-captured photo before a receipt exists. */
export async function stashPendingReceiptPhoto(photo: Blob): Promise<void> {
  try {
    const dataUrl = await blobToDataUrl(photo);
    sessionStorage.setItem(PENDING_KEY, dataUrl);
  } catch {
    // Non-fatal: the photo just won't be offered for download.
  }
}

/** Move the pending photo onto the receipt that was created from it. */
export function attachPendingReceiptPhoto(receiptId: string): void {
  try {
    const dataUrl = sessionStorage.getItem(PENDING_KEY);
    if (!dataUrl) return;
    sessionStorage.setItem(keyFor(receiptId), dataUrl);
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Non-fatal, as above.
  }
}

/** Pass null for the not-yet-attached pending photo (OCR-failure path). */
export function getReceiptPhotoDataUrl(receiptId: string | null): string | null {
  try {
    return sessionStorage.getItem(receiptId ? keyFor(receiptId) : PENDING_KEY);
  } catch {
    return null;
  }
}

export function receiptPhotoFilename(scannedAt: number): string {
  const d = new Date(scannedAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `divvy-receipt-${date}-${time}.jpg`;
}
