"use client";

import { useEffect, useState } from "react";
import { subscribeToReceipt } from "@/lib/firestore";
import type { Receipt } from "@/types";

export function useReceipt(id: string) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const unsubscribe = subscribeToReceipt(id, (data) => {
        setReceipt(data);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to subscribe to receipt"));
      setLoading(false);
    }
  }, [id]);

  return { receipt, loading, error };
}
