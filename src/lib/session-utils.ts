import type { Session } from "@/types";

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateSessionId(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

export function isSessionExpired(session: Session): boolean {
  return Date.now() > session.expires_at;
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function getExpiresAt(createdAt: number = Date.now()): number {
  return createdAt + TWENTY_FOUR_HOURS;
}

export function getParticipantId(sessionId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`divvy-participant-${sessionId}`);
}

export function setParticipantId(sessionId: string, participantId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`divvy-participant-${sessionId}`, participantId);
}
