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

  // Navigate to claim page when session becomes active
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
      <div className="flex flex-col items-center gap-6">
        <Logo size="sm" />

        <h2 className="text-xl font-semibold text-divvy-dark text-center">
          Share with your group
        </h2>

        <QRDisplay sessionId={id} />
        <ShareLink sessionId={id} />
        <ParticipantList participants={session.participants} />

        <Button
          onClick={handleStartSplitting}
          disabled={session.participants.length < 2}
        >
          {session.participants.length < 2
            ? "Waiting for others to join..."
            : "Start Splitting"}
        </Button>
      </div>
    </PageContainer>
  );
}
