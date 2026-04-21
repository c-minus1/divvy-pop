"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Logo from "@/components/ui/Logo";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useSession } from "@/hooks/useSession";
import { addParticipant } from "@/lib/firestore";
import { getParticipantId, setParticipantId, isSessionExpired } from "@/lib/session-utils";

export default function JoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { session, loading } = useSession(id);
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const existingId = getParticipantId(id);
    if (existingId && session) {
      const isParticipant = session.participants.some((p) => p.id === existingId);
      if (isParticipant) {
        setJoined(true);
      }
    }
  }, [id, session]);

  useEffect(() => {
    if (joined && session?.status === "active") {
      router.push(`/claim/${id}`);
    }
    if (session?.status === "complete") {
      router.push(`/complete/${id}`);
    }
  }, [joined, session?.status, id, router]);

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
          <Logo size="sm" />
          <p className="font-pixel text-xs text-divvy-ink-dim">Session not found.</p>
          <Button variant="ghost" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (isSessionExpired(session)) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <Logo size="sm" />
          <p className="font-pixel text-xs text-divvy-ink-dim">This session has expired.</p>
          <Button variant="ghost" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (joined) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center flex-1 gap-6">
          <Logo size="sm" />
          <Card className="flex flex-col items-center gap-4 py-8 w-full">
            <LoadingSpinner size="md" className="text-divvy-teal" />
            <p className="font-pixel text-xs text-divvy-ink text-center leading-relaxed">
              Waiting for host to
              <br />
              start splitting...
            </p>
            <p className="font-pixel text-[10px] text-divvy-ink-dim">
              {session.participants.length} people have joined
            </p>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const handleJoin = async () => {
    if (!name.trim()) return;
    setJoining(true);

    try {
      const participantId = crypto.randomUUID();
      await addParticipant(id, {
        id: participantId,
        name: name.trim(),
        joined_at: Date.now(),
      });
      setParticipantId(id, participantId);
      setJoined(true);
    } catch (err) {
      console.error("Failed to join:", err);
      setJoining(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center flex-1 gap-6">
        <Logo size="md" showTagline />

        <Card className="w-full">
          <h2 className="font-pixel text-base text-divvy-ink mb-4 text-center">
            Join the split
          </h2>
          <div className="flex flex-col gap-4">
            <Input
              label="What's your name?"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              autoFocus
            />
            <Button onClick={handleJoin} loading={joining} disabled={!name.trim()}>
              Join
            </Button>
          </div>
        </Card>

        <p className="font-pixel text-[10px] text-divvy-ink-dim">
          {session.participants.length} already in this session
        </p>
      </div>
    </PageContainer>
  );
}
