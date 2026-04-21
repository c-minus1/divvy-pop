"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Logo from "@/components/ui/Logo";
import Card from "@/components/ui/Card";
import CameraCapture from "@/components/scan/CameraCapture";
import ManualEntryForm from "@/components/scan/ManualEntryForm";
import { createReceipt } from "@/lib/firestore";
import type { LineItem, Receipt } from "@/types";

export default function ScanPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"capture" | "scanning" | "manual" | "error">("capture");
  const [errorMessage, setErrorMessage] = useState("");
  const [rawText, setRawText] = useState("");
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
        setRawText(typeof data.rawText === "string" ? data.rawText : "");
        setStatus("manual");
        return;
      }

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
        setRawText("");
        setStatus("manual");
        return;
      }
      if (typeof data.warning === "string" && data.warning) {
        try {
          sessionStorage.setItem(`divvy:parse-warning:${receiptId}`, data.warning);
        } catch {
          // sessionStorage can throw in private mode; non-fatal.
        }
      }
      router.push(`/receipt/${receiptId}`);
    } catch {
      setErrorMessage("Something went wrong. Try entering items manually.");
      setRawText("");
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
      <div className="flex flex-col gap-6">
        <div className="self-start">
          <Logo size="sm" />
        </div>

        {status === "capture" && (
          <div className="flex flex-col items-center gap-6">
            <h2 className="font-pixel text-xl text-divvy-ink text-center">
              Scan your bill
            </h2>
            <CameraCapture onCapture={handleCapture} />
            <button
              onClick={() => setStatus("manual")}
              className="font-pixel text-[10px] text-divvy-ink-dim underline underline-offset-4 tracking-wide"
            >
              Enter items manually instead
            </button>
          </div>
        )}

        {status === "scanning" && (
          <div className="flex flex-1 items-center justify-center min-h-[60vh]">
            <p className="font-pixel text-xl text-divvy-green text-center">
              Scanning...
            </p>
          </div>
        )}

        {status === "manual" && (
          <>
            {errorMessage && (
              <Card className="border border-amber-400/30 bg-amber-500/10 text-amber-200 w-full">
                <p className="text-sm">{errorMessage}</p>
                {rawText && (
                  <details className="mt-2">
                    <summary className="text-xs text-amber-200/70 cursor-pointer">
                      Show what the camera read
                    </summary>
                    <pre className="mt-2 text-xs text-amber-100 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                      {rawText}
                    </pre>
                  </details>
                )}
              </Card>
            )}
            <ManualEntryForm onSubmit={handleManualEntry} loading={saving} />
          </>
        )}

        {status === "error" && (
          <Card className="flex flex-col items-center gap-4 w-full">
            <p className="text-red-400">{errorMessage}</p>
            <button
              onClick={() => setStatus("capture")}
              className="font-pixel text-xs text-divvy-teal underline underline-offset-4"
            >
              Try again
            </button>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
