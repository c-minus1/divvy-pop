"use client";

import { useEffect, useState } from "react";
import { subscribeToSession } from "@/lib/firestore";
import type { Session } from "@/types";

export function useSession(id: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const unsubscribe = subscribeToSession(id, (data) => {
        setSession(data);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to subscribe to session"));
      setLoading(false);
    }
  }, [id]);

  return { session, loading, error };
}
