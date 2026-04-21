"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Logo from "@/components/ui/Logo";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LineItemRow from "@/components/receipt/LineItemRow";
import ReceiptTotals from "@/components/receipt/ReceiptTotals";
import NameEntryModal from "@/components/receipt/NameEntryModal";
import { getReceipt, updateReceipt, createSession } from "@/lib/firestore";
import { generateSessionId, getExpiresAt, setParticipantId } from "@/lib/session-utils";
import type { Receipt, LineItem, Session } from "@/types";

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [parseWarning] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const key = `divvy:parse-warning:${id}`;
      const stored = sessionStorage.getItem(key);
      if (stored) sessionStorage.removeItem(key);
      return stored ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    getReceipt(id).then((r) => {
      setReceipt(r);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <LoadingSpinner size="lg" className="text-divvy-teal" />
        </div>
      </PageContainer>
    );
  }

  if (!receipt) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <p className="font-pixel text-xs text-divvy-ink-dim">Receipt not found.</p>
          <Button variant="ghost" onClick={() => router.push("/scan")}>
            Scan a new receipt
          </Button>
        </div>
      </PageContainer>
    );
  }

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = { ...receipt };
    updated.line_items = [...receipt.line_items];
    updated.line_items[index] = { ...updated.line_items[index], [field]: value };
    updated.subtotal = updated.line_items.reduce((sum, item) => sum + item.price, 0);
    updated.total = updated.subtotal + updated.tax + updated.tip;
    setReceipt(updated);
  };

  const addItem = () => {
    setReceipt({
      ...receipt,
      line_items: [
        ...receipt.line_items,
        { id: crypto.randomUUID(), name: "", price: 0, item_order: receipt.line_items.length },
      ],
    });
  };

  const removeItem = (index: number) => {
    const updated = { ...receipt };
    updated.line_items = receipt.line_items.filter((_, i) => i !== index);
    updated.subtotal = updated.line_items.reduce((sum, item) => sum + item.price, 0);
    updated.total = updated.subtotal + updated.tax + updated.tip;
    setReceipt(updated);
  };

  const handleTaxChange = (tax: number, taxRate: number) => {
    setReceipt({
      ...receipt,
      tax,
      tax_rate: taxRate,
      total: receipt.subtotal + tax + receipt.tip,
    });
  };

  const handleTipChange = (tip: number, tipRate: number) => {
    setReceipt({
      ...receipt,
      tip,
      tip_rate: tipRate,
      total: receipt.subtotal + receipt.tax + tip,
    });
  };

  const handleCreateSession = async (hostName: string) => {
    setSaving(true);
    setSaveError("");
    try {
      await updateReceipt(receipt.id, {
        ...receipt,
        status: "confirmed",
      });

      const sessionId = generateSessionId();
      const now = Date.now();
      const hostParticipantId = crypto.randomUUID();

      const session: Session = {
        id: sessionId,
        receipt_id: receipt.id,
        created_at: now,
        expires_at: getExpiresAt(now),
        status: "waiting",
        participants: [
          { id: hostParticipantId, name: hostName, joined_at: now },
        ],
      };

      await createSession(session);
      await updateReceipt(receipt.id, { session_id: sessionId });

      setParticipantId(sessionId, hostParticipantId);

      router.push(`/split/${sessionId}`);
    } catch (err) {
      console.error("Failed to create session:", err);
      const message = err instanceof Error ? err.message : String(err);
      setSaveError(`Couldn't create session: ${message}`);
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div className="self-start">
          <Logo size="sm" />
        </div>
        <h2 className="font-pixel text-xl text-divvy-ink text-center">
          Review the bill
        </h2>

        {parseWarning && (
          <Card className="border border-amber-400/30 bg-amber-500/10 w-full">
            <p className="text-amber-200 text-sm">{parseWarning}</p>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {receipt.line_items.map((item, index) => (
            <LineItemRow
              key={item.id}
              index={index}
              name={item.name}
              price={item.price}
              onNameChange={(name) => updateItem(index, "name", name)}
              onPriceChange={(price) => updateItem(index, "price", price)}
              onDelete={() => removeItem(index)}
            />
          ))}
          <button
            onClick={addItem}
            className="font-pixel text-[10px] text-divvy-teal py-2 self-start tracking-wide underline underline-offset-4"
          >
            + Add Item
          </button>
        </div>

        <ReceiptTotals
          subtotal={receipt.subtotal}
          tax={receipt.tax}
          taxRate={receipt.tax_rate}
          tip={receipt.tip}
          tipRate={receipt.tip_rate}
          total={receipt.total}
          onTaxChange={handleTaxChange}
          onTipChange={handleTipChange}
        />

        {saveError && (
          <Card className="border border-amber-400/30 bg-amber-500/10 w-full">
            <p className="text-amber-200 text-sm">{saveError}</p>
          </Card>
        )}

        <Button onClick={() => setNameModalOpen(true)}>
          Ready to share
        </Button>
      </div>

      <NameEntryModal
        isOpen={nameModalOpen}
        loading={saving}
        error={saveError}
        onClose={() => !saving && setNameModalOpen(false)}
        onSubmit={handleCreateSession}
      />
    </PageContainer>
  );
}
