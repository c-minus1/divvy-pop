"use client";

import { useEffect, useState } from "react";
import { subscribeToClaims } from "@/lib/firestore";
import type { Claim } from "@/types";

export function useClaims(sessionId: string) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const unsubscribe = subscribeToClaims(sessionId, (data) => {
        setClaims(data);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to subscribe to claims"));
      setLoading(false);
    }
  }, [sessionId]);

  return { claims, loading, error };
}
