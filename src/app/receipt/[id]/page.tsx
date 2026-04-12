"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Logo from "@/components/ui/Logo";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LineItemRow from "@/components/receipt/LineItemRow";
import ReceiptTotals from "@/components/receipt/ReceiptTotals";
import { getReceipt, updateReceipt, createSession } from "@/lib/firestore";
import { generateSessionId, getExpiresAt, setParticipantId } from "@/lib/session-utils";
import type { Receipt, LineItem, Session } from "@/types";

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hostName, setHostName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);

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
          <p className="text-divvy-dark/70">Receipt not found.</p>
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

  const handleConfirm = async () => {
    if (!showNameInput) {
      setShowNameInput(true);
      return;
    }

    if (!hostName.trim()) return;

    setSaving(true);
    try {
      // Update receipt status
      await updateReceipt(receipt.id, {
        ...receipt,
        status: "confirmed",
      });

      // Create session
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
          { id: hostParticipantId, name: hostName.trim(), joined_at: now },
        ],
      };

      await createSession(session);
      await updateReceipt(receipt.id, { session_id: sessionId });

      // Store host identity
      setParticipantId(sessionId, hostParticipantId);

      router.push(`/split/${sessionId}`);
    } catch (err) {
      console.error("Failed to create session:", err);
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Logo size="sm" />
        <h2 className="text-xl font-semibold text-divvy-dark text-center">
          Review your receipt
        </h2>

        <Card>
          <div className="flex flex-col gap-3">
            {receipt.line_items.map((item, index) => (
              <LineItemRow
                key={item.id}
                name={item.name}
                price={item.price}
                onNameChange={(name) => updateItem(index, "name", name)}
                onPriceChange={(price) => updateItem(index, "price", price)}
                onDelete={() => removeItem(index)}
              />
            ))}
            <button
              onClick={addItem}
              className="text-sm text-divvy-teal font-medium py-2 hover:underline"
            >
              + Add Item
            </button>
          </div>
        </Card>

        <Card>
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
        </Card>

        {showNameInput && (
          <Card>
            <Input
              label="Your name"
              placeholder="Enter your name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              autoFocus
            />
          </Card>
        )}

        <Button onClick={handleConfirm} loading={saving}>
          {showNameInput ? "Create Session" : "Looks Good"}
        </Button>
      </div>
    </PageContainer>
  );
}
