"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import QRDisplay from "@/components/split/QRDisplay";
import ParticipantList from "@/components/split/ParticipantList";
import ShareLink from "@/components/split/ShareLink";
import { useSession } from "@/hooks/useSession";
import { updateSession } from "@/lib/firestore";
import { updateReceipt } from "@/lib/firestore";

export default function SplitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { session, loading } = useSession(id);

  useEffect(() => {
    if (session?.status === "active") {
      router.push(`/claim/${id}`);
    }
  }, [session?.status, id, router]);

  const handleStartSplitting = async () => {
    if (!session) return;
    await updateSession(id, { status: "active" });
    await updateReceipt(session.receipt_id, { status: "splitting" });
    router.push(`/claim/${id}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center flex-1">
          <LoadingSpinner size="lg" className="text-divvy-teal" />
        </div>
      </PageContainer>
    );
  }

  if (!session) {
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

  const canStart = session.participants.length >= 2;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <span className="w-px h-6 bg-white/20" aria-hidden />
            <span className="font-pixel text-[10px] text-divvy-ink tracking-wide">
              Live session
            </span>
          </div>
        </div>

        <h2 className="font-pixel text-xl text-divvy-ink text-center">
          Share with your group
        </h2>

        <QRDisplay sessionId={id} />
        <ShareLink sessionId={id} />
        <ParticipantList participants={session.participants} />

        <Button onClick={handleStartSplitting} disabled={!canStart}>
          {canStart ? "Start Splitting" : "Waiting for others..."}
        </Button>
      </div>
    </PageContainer>
  );
}
