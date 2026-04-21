import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  limit,
  query,
  where,
  onSnapshot,
  arrayUnion,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Session, Receipt, Claim, Participant } from "@/types";

// Cap claim queries so firestore.rules can enforce a max page size.
// A realistic session is ~20 items × a few claims; 500 is generous headroom.
const CLAIMS_PAGE_LIMIT = 500;

// --- Sessions ---

export async function createSession(session: Session): Promise<void> {
  await setDoc(doc(db, "sessions", session.id), session);
}

export async function getSession(id: string): Promise<Session | null> {
  const snap = await getDoc(doc(db, "sessions", id));
  return snap.exists() ? (snap.data() as Session) : null;
}

export async function updateSession(
  id: string,
  data: Partial<Session>
): Promise<void> {
  await updateDoc(doc(db, "sessions", id), data);
}

export async function addParticipant(
  sessionId: string,
  participant: Participant
): Promise<void> {
  await updateDoc(doc(db, "sessions", sessionId), {
    participants: arrayUnion(participant),
  });
}

export function subscribeToSession(
  id: string,
  callback: (session: Session | null) => void
): () => void {
  return onSnapshot(doc(db, "sessions", id), (snap) => {
    callback(snap.exists() ? (snap.data() as Session) : null);
  });
}

// --- Receipts ---

export async function createReceipt(receipt: Receipt): Promise<void> {
  await setDoc(doc(db, "receipts", receipt.id), receipt);
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const snap = await getDoc(doc(db, "receipts", id));
  return snap.exists() ? (snap.data() as Receipt) : null;
}

export async function updateReceipt(
  id: string,
  data: Partial<Receipt>
): Promise<void> {
  await updateDoc(doc(db, "receipts", id), data);
}

export function subscribeToReceipt(
  id: string,
  callback: (receipt: Receipt | null) => void
): () => void {
  return onSnapshot(doc(db, "receipts", id), (snap) => {
    callback(snap.exists() ? (snap.data() as Receipt) : null);
  });
}

// --- Claims ---

export async function createClaim(claim: Claim): Promise<void> {
  await setDoc(doc(db, "claims", claim.id), claim);
}

export async function deleteClaim(id: string): Promise<void> {
  await deleteDoc(doc(db, "claims", id));
}

export async function getClaimsBySession(sessionId: string): Promise<Claim[]> {
  const q = query(
    collection(db, "claims"),
    where("session_id", "==", sessionId),
    limit(CLAIMS_PAGE_LIMIT)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Claim);
}

export function subscribeToClaims(
  sessionId: string,
  callback: (claims: Claim[]) => void
): () => void {
  const q = query(
    collection(db, "claims"),
    where("session_id", "==", sessionId),
    limit(CLAIMS_PAGE_LIMIT)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Claim));
  });
}
