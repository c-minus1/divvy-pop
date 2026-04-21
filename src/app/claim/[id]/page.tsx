"use client";

import { useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ClaimableItem from "@/components/claim/ClaimableItem";
import ClaimModal from "@/components/claim/ClaimModal";
import PersonalTotal from "@/components/claim/PersonalTotal";
import ClaimProgress from "@/components/claim/ClaimProgress";
import { useSession } from "@/hooks/useSession";
import { useReceipt } from "@/hooks/useReceipt";
import { useClaims } from "@/hooks/useClaims";
import { createClaim, deleteClaim } from "@/lib/firestore";
import { calculatePersonShare } from "@/lib/calculations";
import { getParticipantId } from "@/lib/session-utils";
import type { LineItem, Claim } from "@/types";

export default function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession(id);
  const { receipt, loading: receiptLoading } = useReceipt(session?.receipt_id || "");
  const { claims, loading: claimsLoading } = useClaims(id);
  const [selectedItem, setSelectedItem] = useState<LineItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const currentUserId = typeof window !== "undefined" ? getParticipantId(id) : null;

  const personalTotal = useMemo(() => {
    if (!currentUserId || !receipt) {
      return { items: 0, tax: 0, tip: 0, total: 0 };
    }
    return calculatePersonShare(currentUserId, claims, receipt);
  }, [currentUserId, claims, receipt]);

  const claimedItemCount = useMemo(() => {
    if (!receipt) return 0;
    return receipt.line_items.filter((item) =>
      claims.some((c) => c.line_item_id === item.id)
    ).length;
  }, [receipt, claims]);

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

  if (!session || !receipt || !currentUserId) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <p className="font-pixel text-xs text-divvy-ink-dim">Session not found.</p>
          <Button variant="ghost" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleClaim = (item: LineItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleUnclaim = async (claimId: string) => {
    await deleteClaim(claimId);
  };

  const handleClaimIndividual = async (item: LineItem) => {
    const claim: Claim = {
      id: crypto.randomUUID(),
      session_id: id,
      line_item_id: item.id,
      participant_ids: [currentUserId],
      share: 1,
      claim_type: "individual",
      created_at: Date.now(),
    };
    await createClaim(claim);
  };

  const handleClaimSplit = async (item: LineItem, participantIds: string[]) => {
    const claim: Claim = {
      id: crypto.randomUUID(),
      session_id: id,
      line_item_id: item.id,
      participant_ids: participantIds,
      share: 1,
      claim_type: "split",
      created_at: Date.now(),
    };
    await createClaim(claim);
  };

  const handleClaimAll = async (item: LineItem) => {
    const allIds = session.participants.map((p) => p.id);
    const claim: Claim = {
      id: crypto.randomUUID(),
      session_id: id,
      line_item_id: item.id,
      participant_ids: allIds,
      share: 1,
      claim_type: "all",
      created_at: Date.now(),
    };
    await createClaim(claim);
  };

  const allClaimed = claimedItemCount === receipt.line_items.length;

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 pb-28">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <span className="w-px h-6 bg-white/20" aria-hidden />
            <span className="font-pixel text-[10px] text-divvy-ink tracking-wide">
              Live session
            </span>
          </div>
        </div>

        <ClaimProgress
          claimed={claimedItemCount}
          total={receipt.line_items.length}
        />

        <div className="flex flex-col gap-2">
          {receipt.line_items
            .sort((a, b) => a.item_order - b.item_order)
            .map((item) => (
              <ClaimableItem
                key={item.id}
                item={item}
                claims={claims}
                participants={session.participants}
                currentUserId={currentUserId}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
              />
            ))}
        </div>

        {allClaimed && (
          <Button onClick={() => router.push(`/complete/${id}`)}>
            View Summary
          </Button>
        )}
      </div>

      <PersonalTotal total={personalTotal} />

      <ClaimModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedItem}
        participants={session.participants}
        currentUserId={currentUserId}
        onClaimIndividual={handleClaimIndividual}
        onClaimSplit={handleClaimSplit}
        onClaimAll={handleClaimAll}
      />
    </PageContainer>
  );
}
