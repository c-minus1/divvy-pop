export type SessionStatus = "waiting" | "active" | "complete";
export type ReceiptStatus = "scanned" | "confirmed" | "splitting" | "complete";
export type ClaimType = "individual" | "split" | "all";

export interface Participant {
  id: string;
  name: string;
  joined_at: number;
}

export interface Session {
  id: string;
  receipt_id: string;
  created_at: number;
  expires_at: number;
  status: SessionStatus;
  participants: Participant[];
}

export interface LineItem {
  id: string;
  name: string;
  price: number;
  item_order: number;
}

export interface Receipt {
  id: string;
  image_url: string;
  scanned_at: number;
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  tax_rate: number;
  tip: number;
  tip_rate: number;
  total: number;
  status: ReceiptStatus;
  session_id: string;
}

export interface Claim {
  id: string;
  session_id: string;
  line_item_id: string;
  participant_ids: string[];
  share: number;
  claim_type: ClaimType;
  created_at: number;
}

export interface PersonTotal {
  items: number;
  tax: number;
  tip: number;
  total: number;
}
