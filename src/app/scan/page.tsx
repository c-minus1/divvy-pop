"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Logo from "@/components/ui/Logo";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CameraCapture from "@/components/scan/CameraCapture";
import ManualEntryForm from "@/components/scan/ManualEntryForm";
import { createReceipt } from "@/lib/firestore";
import type { LineItem, Receipt } from "@/types";

export default function ScanPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"capture" | "scanning" | "manual" | "error">("capture");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const describeError = (err: unknown) =>
    err instanceof Error ? err.message : String(err);

  const handleCapture = async (file: File) => {
    setStatus("scanning");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await response.json();

      if (data.error) {
        setErrorMessage(data.message || "Could not read the receipt.");
        setStatus("manual");
        return;
      }

      // Create receipt from OCR results
      const receiptId = crypto.randomUUID();
      const lineItems: LineItem[] = data.line_items.map(
        (item: { name: string; price: number; item_order: number }, index: number) => ({
          id: crypto.randomUUID(),
          name: item.name,
          price: item.price,
          item_order: item.item_order ?? index,
        })
      );

      const receipt: Receipt = {
        id: receiptId,
        image_url: "",
        scanned_at: Date.now(),
        line_items: lineItems,
        subtotal: data.subtotal,
        tax: data.tax,
        tax_rate: data.subtotal > 0 ? (data.tax / data.subtotal) * 100 : 0,
        tip: 0,
        tip_rate: 0,
        total: data.total,
        status: "scanned",
        session_id: "",
      };

      try {
        await createReceipt(receipt);
      } catch (err) {
        console.error("Failed to save receipt:", err);
        setErrorMessage(`Couldn't save receipt: ${describeError(err)}`);
        setStatus("manual");
        return;
      }
      router.push(`/receipt/${receiptId}`);
    } catch {
      setErrorMessage("Something went wrong. Try entering items manually.");
      setStatus("manual");
    }
  };

  const handleManualEntry = async (result: {
    items: { name: string; price: number }[];
    taxRate: number;
    tipRate: number;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
  }) => {
    const receiptId = crypto.randomUUID();
    const lineItems: LineItem[] = result.items.map((item, index) => ({
      id: crypto.randomUUID(),
      name: item.name,
      price: item.price,
      item_order: index,
    }));

    const receipt: Receipt = {
      id: receiptId,
      image_url: "",
      scanned_at: Date.now(),
      line_items: lineItems,
      subtotal: result.subtotal,
      tax: result.tax,
      tax_rate: result.taxRate,
      tip: result.tip,
      tip_rate: result.tipRate,
      total: result.total,
      status: "scanned",
      session_id: "",
    };

    setSaving(true);
    setErrorMessage("");
    try {
      await createReceipt(receipt);
    } catch (err) {
      console.error("Failed to save receipt:", err);
      setErrorMessage(`Couldn't save receipt: ${describeError(err)}`);
      setSaving(false);
      return;
    }
    router.push(`/receipt/${receiptId}`);
  };

  return (
    <PageContainer>
      <div className="flex flex-col items-center gap-6">
        <Logo size="sm" />

        {status === "capture" && (
          <>
            <h2 className="text-xl font-semibold text-divvy-dark">
              Scan your receipt
            </h2>
            <CameraCapture onCapture={handleCapture} />
            <button
              onClick={() => setStatus("manual")}
              className="text-sm text-divvy-teal font-medium underline underline-offset-2"
            >
              Enter items manually instead
            </button>
          </>
        )}

        {status === "scanning" && (
          <Card className="flex flex-col items-center gap-4 py-12 w-full">
            <LoadingSpinner size="lg" className="text-divvy-teal" />
            <p className="text-divvy-dark/70 font-medium">
              Scanning your receipt...
            </p>
          </Card>
        )}

        {status === "manual" && (
          <>
            {errorMessage && (
              <Card className="!bg-amber-50 border border-amber-200 w-full">
                <p className="text-amber-800 text-sm">{errorMessage}</p>
              </Card>
            )}
            <ManualEntryForm onSubmit={handleManualEntry} loading={saving} />
          </>
        )}

        {status === "error" && (
          <Card className="flex flex-col items-center gap-4 w-full">
            <p className="text-red-600">{errorMessage}</p>
            <button
              onClick={() => setStatus("capture")}
              className="text-divvy-teal font-medium underline"
            >
              Try again
            </button>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
