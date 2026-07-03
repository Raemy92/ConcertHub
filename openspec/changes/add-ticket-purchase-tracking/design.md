## Context

`participations` uses document IDs of the form `{concertId}_{uid}` and today's security rules tie writes to that uid — only the user themselves can write their participation doc. The "Tickets" tab on the concert detail view lets a participant toggle their own `hasTicket` flag and shows the result split into "Hat Ticket" / "Wartet auf Ticket" sections.

A 12-person friend group has high trust internally and low need for adversarial isolation between participants. The driving constraint is therefore convenience, not iron-clad authz.

## Goals / Non-Goals

**Goals:**

- Buyer can mark several friends' tickets in one action.
- Concert creator can prefill the participant list while purchasing tickets, without a second navigation step.
- Both the buyer and the debtor can see "who owes whom" without scrolling or guessing.
- Toggling paid status is a single tap and reversible.
- Existing data continues to work — a participation without the new fields is treated as "self-bought, no debt".

**Non-Goals:**

- Money transfer integration (Twint / PayPal / Revolut deep-links). Could be added later.
- Itemised cost split (per-ticket price overrides, fees, splitting the booking fee). Out of scope — the buyer absorbs any fee diff or sorts it on the side.
- Multi-buyer (two people splitting one ticket purchase). Each participation has one buyer.
- Refund / void flow for cancelled concerts (the concert archive flag already covers wind-down).
- Notifications when paid status changes. Not needed for a 12-person group.

## Decisions

### Decision 1: Extend `participations` rather than create a `tickets` collection

**Choice:** Add `ticketPurchasedBy?: string` and `ticketPaid?: boolean` directly to the existing `Participation` document.

**Why:** A ticket is intrinsically per-participant — the relationship is 1:1. A separate collection would force a join on every render of the Tickets tab and would duplicate the `{concertId, userId}` keying. Extending the existing doc keeps the live `onSnapshot` in the tab untouched.

**Trade-off:** The participation doc now carries three loosely-related concerns (attendance, carpool, tickets). Already true today (`isDriver`, `availableSeats`, `driverId` live alongside `hasTicket`); we're following the existing pattern.

### Decision 2: Defaults for missing fields

**Choice:**

- Missing `ticketPurchasedBy` ⇒ treated as self-bought.
- Missing `ticketPaid` ⇒ treated as `false` **when** `ticketPurchasedBy != userId` is true. When the user bought their own ticket, `ticketPaid` is meaningless and the UI does not render the pill.

**Why:** Keeps existing rows working without a backfill. The "missing means false" convention matches the project's existing optional-boolean handling for `hasTicket`.

### Decision 3: Relaxed write rules over Cloud Functions

**Choice:** Allow any concert participant to update the three ticket-related fields on any other participation for the same concert, with one server-enforced constraint: if the update sets `ticketPurchasedBy`, it must equal `request.auth.uid`. Concert creators may additionally `create` participation docs for any uid (only on their own concert).

**Why:** A Cloud Function would gate every write through a callable, breaking the live `onSnapshot` UI and adding latency. The threat model (a malicious participant editing someone else's ticket fields) is acceptable in a 12-person friend group. The one critical constraint — you can only claim to be the buyer of yourself — is enforced server-side.

**Trade-off:** A participant could maliciously flip another participant's `hasTicket` or `ticketPaid` flag. We accept this; the group trust model covers it.

**Rule sketch (final form to be tuned in tasks):**

```
match /participations/{partId} {
  allow read: if request.auth != null;

  // own create / delete / non-ticket update (existing behaviour)
  allow create: if request.auth != null && partId == request.resource.data.concertId + "_" + request.auth.uid;
  allow delete: if request.auth != null && partId.matches("^.+_" + request.auth.uid + "$");

  // creator may create participations for others on their own concert
  allow create: if request.auth != null
    && get(/databases/$(database)/documents/concerts/$(request.resource.data.concertId)).data.createdBy == request.auth.uid
    && (request.resource.data.ticketPurchasedBy == null
        || request.resource.data.ticketPurchasedBy == request.auth.uid);

  // any participant of the concert may update only ticket-related fields on any participation for that concert
  allow update: if request.auth != null
    && exists(/databases/$(database)/documents/participations/$(resource.data.concertId + "_" + request.auth.uid))
    && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(["hasTicket", "ticketPurchasedBy", "ticketPaid"])
    && (request.resource.data.ticketPurchasedBy == null
        || request.resource.data.ticketPurchasedBy == request.auth.uid);

  // own full update (existing behaviour for driver / seats / etc.)
  allow update: if request.auth != null && partId.matches("^.+_" + request.auth.uid + "$");
}
```

### Decision 4: Buyer can clear `ticketPurchasedBy` only from their own row

**Choice:** A user can clear their own `ticketPurchasedBy` (via "Selbst gekauft") regardless of who set it. The original buyer cannot reach into someone else's row to "take it back" — they would set `hasTicket = false` instead, which is permitted by Decision 3.

**Why:** The debtor is the rightful owner of their own attendance record; if they say they bought it themselves, they did. The buyer can still cancel the assignment by toggling `hasTicket` off (which leaves `ticketPurchasedBy` set but stops the row from showing as ticketed).

**Trade-off:** Slight asymmetry, but matches the user-mental-model where "my ticket is mine".

### Decision 5: Creator quick-add lists "known friends", not all auth users

**Choice:** The "Weitere Teilnehmende hinzufügen" section enumerates **users who have ever participated in any concert** (= the de-facto friend group), not the full `users` collection.

**Why:** ConcertHub is a closed friend-group app; surfacing every signed-up user is noise. Querying participants-ever yields ~12 entries.

**Implementation note:** A small client-side dedup over the cached user docs is sufficient — at this scale, we can read `users` once on modal open and filter to "has at least one participation" by scanning the participation cache (a single client query). Alternatively, expose a denormalised `users/{uid}.hasEverParticipated: boolean` written by a tiny Cloud Function on first participation — but this adds infra for negligible gain at the current scale.

### Decision 6: Single buyer per ticket, no split

**Choice:** `ticketPurchasedBy` is a single uid, not an array.

**Why:** Trying to model "Anna and Bea split this ticket" pulls in fractional debt math, partial paid states, and per-row UI complexity for a vanishingly rare case. Out of scope.

## Risks / Trade-offs

- **Rule complexity:** the diff-based update rule is more involved than the current ownership-only rule. Mitigation: rules unit tests covering the matrix of (own row vs. other row) × (ticket-only update vs. mixed update) × (purchasedBy = self vs. other).
- **Stale buyer view after `hasTicket = false`:** if the buyer cancels by toggling `hasTicket`, the row leaves the "Du hast Tickets gekauft" panel. Acceptable — the panel reflects active assignments.
- **Creator adds wrong person:** any participant can `leave` themselves out — the existing delete rule covers this.
- **No money-movement integration:** users still have to actually pay each other (cash / Twint / etc.) outside the app. The app only tracks status, which is the point — keep it boring.

## Migration

- No data migration required. Existing participations without the new fields are treated as self-bought; the UI does not render the new annotations for them.
- Rules deploy must happen **before** the new client UI ships, or the new fields will fail to write.
