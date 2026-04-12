# Divvy

**Tagline:** "the smarter way to split"

A mobile-first web app that lets groups split restaurant bills in ~60 seconds. No accounts, no app download required.

## Brand
- Logo uses a pixel/retro-style wordmark with a green → teal → blue gradient
- Background palette: yellow-to-pink gradient
- Keep UI feeling fun and approachable, not clinical or finance-y

---

## Stack

**Frontend**
- Next.js (App Router) with TypeScript
- Tailwind CSS for styling
- PWA (mobile-first — touch targets, camera access, offline support)
- `qrcode.react` for QR code generation
- Deployed on Vercel

**Backend**
- Next.js API routes
- Firebase Firestore (real-time sync for session/participant/claim state)
- Firebase Storage (receipt images, auto-deleted after 24 hours)

**OCR**
- Google Cloud Vision API
- API route handles image → text extraction → structured parsing
- Always provide a manual entry fallback — OCR will fail sometimes

**Auth**
- None for MVP. Users identify by name only within a session.

---

## Database Schema

### `sessions`
```
id            string    short alphanumeric code (e.g. "abc123")
receipt_id    string    foreign key to receipts
created_at    timestamp
expires_at    timestamp (24 hours after created_at)
status        string    "waiting" | "active" | "complete"
participants  array     [{ id, name, joined_at }]
```

### `receipts`
```
id            string
image_url     string    Firebase Storage URL
scanned_at    timestamp
line_items    array     [{ id, name, price, item_order }]
subtotal      number
tax           number
tax_rate      number
tip           number
tip_rate      number
total         number
status        string    "scanned" | "confirmed" | "splitting" | "complete"
session_id    string
```

### `claims`
```
id              string
session_id      string
line_item_id    string
participant_ids array     list of participant IDs splitting this item
share           number    1.0 = full item, 0.5 = half, 0.25 = quarter, etc.
claim_type      string    "individual" | "split" | "all"
created_at      timestamp
```

---

## Key Calculation Logic

Tax and tip are distributed **proportionally** based on each person's item subtotal:

```typescript
function calculatePersonShare(personId, claims, receipt): PersonTotal {
  // 1. Sum this person's item share
  let itemsTotal = claims
    .filter(c => c.participant_ids.includes(personId))
    .reduce((sum, c) => {
      const item = receipt.line_items.find(i => i.id === c.line_item_id);
      return sum + (item.price * c.share) / c.participant_ids.length;
    }, 0);

  // 2. Proportional tax and tip
  const ratio = itemsTotal / receipt.subtotal;
  const taxShare = ratio * receipt.tax;
  const tipShare = ratio * receipt.tip;

  return { items: itemsTotal, tax: taxShare, tip: tipShare, total: itemsTotal + taxShare + tipShare };
}
```

All totals across participants must sum to `receipt.total`. Handle penny rounding errors gracefully.

---

## User Flows

### Happy Path (host)
1. `/` — Landing page → tap "Split a Bill"
2. `/scan` — Camera capture or file upload → image compressed client-side before upload
3. OCR runs → parsed items displayed for review
4. Host confirms ("Looks Good") or edits items
5. Receipt saved → session created → `/split/[id]`
6. Full-screen QR code displayed + shareable link
7. Host waits, sees real-time participant list update as friends join
8. Host taps "Start Splitting" → all devices navigate to claiming interface
9. All items claimed → summary screen → payment deep links

### Happy Path (participant)
1. Scans QR or opens shared link → `/join/[sessionId]`
2. Enters name → added to session participants in Firestore
3. Navigates to claiming interface — sees same item list as host
4. Taps items to claim; real-time updates across all devices
5. Summary screen shows personal breakdown + Venmo/Zelle links

### Backup Flow (OCR fails)
- Show friendly error: "Hmm, that didn't work. Enter manually?"
- Manual entry form: add/remove line items, name + price per item
- Tax % and tip % fields → auto-calculate totals
- Rest of flow is identical to happy path from step 4

### Shared Item Flow
- Participant taps an item → modal: "Just you or split?"
- If "Split with Others" → checkboxes for each participant in session
- Amount per person updates live as selections change
- "Shared by All" shortcut — splits evenly across all participants, no modal

---

## Routes

```
/                   Landing page
/scan               Camera capture + OCR
/receipt/[id]       Review + edit parsed receipt
/split/[id]         QR code display + participant waiting room
/join/[id]          Participant join flow (name entry)
/claim/[id]         Item claiming interface
/complete/[id]      Summary + payment links
```

---

## MVP Scope

**In:**
- Photo capture (mobile) + file upload (desktop)
- OCR with manual entry fallback
- Session creation + QR code sharing
- Real-time participant list
- Item claiming (individual, split between selected, shared by all)
- Proportional tax/tip calculation
- Summary screen with Venmo/Zelle deep links + clipboard copy
- Sessions expire after 24 hours

**Out (post-MVP):**
- User accounts or auth
- Payment processing
- Split history
- Custom split percentages
- Cash tracking
- Receipt PDF export
- Discounts or barcode scanning
