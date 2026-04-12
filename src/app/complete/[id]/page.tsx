"use client";

import { useMemo, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Logo from "@/components/ui/Logo";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Button from "@/components/ui/Button";
import PersonBreakdown from "@/components/complete/PersonBreakdown";
import PaymentLinks from "@/components/complete/PaymentLinks";
import GroupSummary from "@/components/complete/GroupSummary";
import { useSession } from "@/hooks/useSession";
import { useReceipt } from "@/hooks/useReceipt";
import { useClaims } from "@/hooks/useClaims";
import { calculateAllShares } from "@/lib/calculations";
import { getParticipantId } from "@/lib/session-utils";
import { updateSession, updateReceipt } from "@/lib/firestore";

export default function CompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession(id);
  const { receipt, loading: receiptLoading } = useReceipt(session?.receipt_id || "");
  const { claims, loading: claimsLoading } = useClaims(id);

  const currentUserId = typeof window !== "undefined" ? getParticipantId(id) : null;

  const shares = useMemo(() => {
    if (!session || !receipt) return new Map();
    const participantIds = session.participants.map((p) => p.id);
    return calculateAllShares(participantIds, claims, receipt);
  }, [session, receipt, claims]);

  const myTotal = currentUserId ? shares.get(currentUserId) : null;
  const currentParticipant = session?.participants.find((p) => p.id === currentUserId);

  // Mark session as complete
  useEffect(() => {
    if (session && session.status !== "complete" && receipt) {
      updateSession(id, { status: "complete" });
      updateReceipt(receipt.id, { status: "complete" });
    }
  }, [session, receipt, id]);

  const loading = sessionLoading || receiptLoading || claimsLoading;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center flex-1">
          <LoadingSpinner size="lg" className="text-divvy-teal" />
        </div>
      </PageContainer>
    );
  }

  if (!session || !receipt || !currentUserId || !myTotal) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <p className="text-divvy-dark/70">Session not found.</p>
          <Button variant="ghost" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Logo size="sm" />

        <div className="text-center">
          <h2 className="text-xl font-semibold text-divvy-dark">
            Your share
          </h2>
          <p className="text-4xl font-bold text-divvy-gradient mt-2 font-pixel">
            ${myTotal.total.toFixed(2)}
          </p>
        </div>

        <PersonBreakdown
          personId={currentUserId}
          personName={currentParticipant?.name || "You"}
          claims={claims}
          receipt={receipt}
          total={myTotal}
        />

        <PaymentLinks amount={myTotal.total} />

        <GroupSummary
          participants={session.participants}
          shares={shares}
          receiptTotal={receipt.total}
        />

        <Button variant="ghost" onClick={() => router.push("/")}>
          Done
        </Button>
      </div>
    </PageContainer>
  );
}
