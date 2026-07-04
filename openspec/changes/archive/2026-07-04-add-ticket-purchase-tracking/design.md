## Context

`participations` uses document IDs of the form `{concertId}_{uid}` and today's security rules tie writes to that uid — only the user themselves can write their participation doc. The "Tickets" tab on the concert detail view lets a participant toggle their own `hasTicket` flag and shows the result split into "Hat Ticket" / "Wartet auf Ticket" sections.

A 12-person friend group has high trust internally and low need for adversarial isolation between participants. The driving constraint is therefore convenience, not iron-clad authz.

## Goals / Non-Goals

**Goals:**

- Buyer can mark several friends' tickets in one action.
- Concert creator can prefill the participant list while purchasing tickets, without a second navigation step.
- Both the buyer and the debtor can see who bought which ticket without scrolling or guessing.
- Existing data continues to work — a participation without the new field is treated as "self-bought".

**Non-Goals:**

- Paid/unpaid tracking. Deliberately dropped — an in-app "Offen / Bezahlt" state proved confusing; the app records only who bought a ticket, and the group settles money on the side.
- Money transfer integration (Twint / PayPal / Revolut deep-links). Could be added later.
- Itemised cost split (per-ticket price overrides, fees, splitting the booking fee). Out of scope — the buyer absorbs any fee diff or sorts it on the side.
- Multi-buyer (two people splitting one ticket purchase). Each participation has one buyer.
- Refund / void flow for cancelled concerts (the concert archive flag already covers wind-down).

## Decisions

### Decision 1: Extend `participations` rather than create a `tickets` collection

**Choice:** Add `ticketPurchasedBy?: string` directly to the existing `Participation` document.

**Why:** A ticket is intrinsically per-participant — the relationship is 1:1. A separate collection would force a join on every render of the Tickets tab and would duplicate the `{concertId, userId}` keying. Extending the existing doc keeps the live `onSnapshot` in the tab untouched.

**Trade-off:** The participation doc now carries three loosely-related concerns (attendance, carpool, tickets). Already true today (`isDriver`, `availableSeats`, `driverId` live alongside `hasTicket`); we're following the existing pattern.

### Decision 2: Defaults for the missing field

**Choice:** Missing `ticketPurchasedBy` (or a value equal to `userId`) ⇒ treated as self-bought; no annotation is rendered.

**Why:** Keeps existing rows working without a backfill. No paid/unpaid state is stored, so there is nothing else to default.

### Decision 3: Relaxed write rules over Cloud Functions

**Choice:** Allow any concert participant to update the two ticket-related fields (`hasTicket`, `ticketPurchasedBy`) on any other participation for the same concert, with one server-enforced constraint: if the update sets `ticketPurchasedBy`, it must equal `request.auth.uid`. Create/delete stay own-doc-only (unchanged).

**Why:** A Cloud Function would gate every write through a callable, breaking the live `onSnapshot` UI and adding latency. The threat model (a malicious participant editing someone else's ticket fields) is acceptable in a 12-person friend group. The one critical constraint — you can only claim to be the buyer of yourself — is enforced server-side.

**Trade-off:** A participant could maliciously flip another participant's `hasTicket` flag or `ticketPurchasedBy` (to themselves). We accept this; the group trust model covers it.

**Rule sketch (final form to be tuned in tasks):**

```
match /participations/{partId} {
  allow read: if request.auth != null;

  // own create / delete / non-ticket update (existing behaviour)
  allow create: if request.auth != null && partId == request.resource.data.concertId + "_" + request.auth.uid;
  allow delete: if request.auth != null && partId.matches("^.+_" + request.auth.uid + "$");

  // any participant of the concert may update only ticket-related fields on any participation for that concert
  allow update: if request.auth != null
    && exists(/databases/$(database)/documents/participations/$(resource.data.concertId + "_" + request.auth.uid))
    && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(["hasTicket", "ticketPurchasedBy"])
    && request.resource.data.get("ticketPurchasedBy", request.auth.uid) == request.auth.uid;

  // own full update (existing behaviour for driver / seats / etc.)
  allow update: if request.auth != null && partId.matches("^.+_" + request.auth.uid + "$");
}
```

### Decision 4: The own-ticket toggle clears the buyer link (no separate "Selbst gekauft" action)

**Choice:** A user takes ownership of their own ticket simply by toggling "Ich habe mein Ticket" on the Dabei tab — `updateTicketStatus` always clears `ticketPurchasedBy`. There is no dedicated "Selbst gekauft" button and no clickable action on the Tickets tab; the Tickets tab is read-only.

**Why:** An explicit "Selbst gekauft" button plus an unlabelled clickable row proved confusing. Folding "I have my ticket" and "I bought it myself" into the single toggle the user already knows keeps one obvious control per concern: own status on Dabei, buying-for-others via the modal.

**Trade-off:** The buyer cannot reach into someone else's row to "take it back"; they toggle `hasTicket` off on their own doc is not possible for others, so an over-assignment is corrected by the debtor toggling their own ticket. Acceptable in a trusted group.

### Decision 5: No creator quick-add — buying is limited to current participants

**Choice:** The buyer modal offers **only** participants who already have a participation for the current concert. There is no "Weitere Teilnehmende hinzufügen" section and no creator-only path to create participations for others.

**Why:** An earlier draft let the creator enumerate "known friends" (anyone who ever participated in any concert) and add them while buying. In practice this surfaced the app's whole user base — including cross-concert strangers and profile-less ghosts that rendered as "Unbekannter Benutzer" — which was confusing and error-prone. A person joins a concert themselves; only then can a ticket be bought for them. This also lets the participation `create` rule stay strictly own-doc-only, removing the creator-create attack surface.

### Decision 6: Single buyer per ticket, no split

**Choice:** `ticketPurchasedBy` is a single uid, not an array.

**Why:** Trying to model "Anna and Bea split this ticket" pulls in fractional debt math, partial paid states, and per-row UI complexity for a vanishingly rare case. Out of scope.

## Risks / Trade-offs

- **Rule complexity:** the diff-based update rule is more involved than the current ownership-only rule. Mitigation: rules unit tests covering the matrix of (own row vs. other row) × (ticket-only update vs. mixed update) × (purchasedBy = self vs. other) — implemented under the `harden-firestore-writes` change, which owns the emulator infrastructure and rules-test suite.
- **Ticket assigned to wrong person:** any participant can toggle their own ticket off (or `leave` the concert) — the existing owner rules cover this.
- **No money-movement integration:** users still have to actually pay each other (cash / Twint / etc.) outside the app. The app only records who bought a ticket — no paid/unpaid state — which is the point: keep it boring.

## Migration

- No data migration required. Existing participations without the new field are treated as self-bought; the UI does not render the "gekauft von" annotation for them.
- Rules deploy must happen **before** the new client UI ships, or the new field will fail to write.
