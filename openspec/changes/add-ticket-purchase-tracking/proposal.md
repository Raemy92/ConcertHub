## Why

In a small friend group, one person often buys tickets for several friends at once — either because the venue has a per-order limit, the tickets are part of a bundle, or simply because someone happened to be at the right place at the right time. ConcertHub today only stores a per-user `hasTicket: boolean`, with no notion of **who bought it for whom** and no way to track **whether the buyer has been paid back**. The result: lost money, double-bookings, and the buyer ending up as a bookkeeper on WhatsApp.

A small extension to the `participations` data model — plus two focused UI flows — fixes both problems and keeps everything inside the app.

## What Changes

- Extend `Participation` with two optional fields:
  - `ticketPurchasedBy?: string` — uid of the user who actually purchased the ticket. Unset (or equal to `userId`) means the user bought it themselves.
  - `ticketPaid?: boolean` — relevant only when `ticketPurchasedBy != userId`. `true` means the user has paid the buyer back. Defaults to `false`.
- Add a new buyer flow on the concert detail "Tickets" tab: **"Tickets für andere gekauft"**. Opens a modal listing the current participants who do not yet have a ticket; the buyer checks the ones they bought tickets for, confirms, and the app marks each as `hasTicket = true`, `ticketPurchasedBy = <buyer.uid>`, `ticketPaid = false`.
- When the buyer is also the **concert creator**, the same modal additionally offers a section "Weitere Teilnehmende hinzufügen" with the remaining known users. Selecting from this section both creates a `participations` document for that user and marks the ticket as purchased by the creator in one write.
- Add a **payment overview** for buyers: at the top of the Tickets tab, if the viewer has at least one participation where they are listed as `ticketPurchasedBy` for someone else, show a "Du hast Tickets gekauft" panel grouping the covered participants into **Bezahlt** and **Offen** sections. Tap on an open entry toggles `ticketPaid = true`. Already-paid entries can be reverted by tapping again (in case of a mis-tap).
- On every individual participant's own ticket row, render a small annotation: "gekauft von {Buyer Name}" when applicable, plus a "Bezahlt" / "Offen" pill mirroring the buyer's view, so the debtor sees their state too.
- A user can manually take ownership of their own ticket: if `ticketPurchasedBy != userId`, the user can tap "Selbst gekauft" to clear `ticketPurchasedBy` and `ticketPaid` (e.g., if the original buyer cancelled, or to undo a mistaken assignment).
- Loosen security rules: participants of a concert SHALL be allowed to update the `hasTicket`, `ticketPurchasedBy`, `ticketPaid` fields on any participation for the same concert, with the constraint that `ticketPurchasedBy`, if set, must equal `request.auth.uid` (you can only mark yourself as the buyer). Concert creators SHALL be allowed to create a new participation for any user on their own concert.

## Capabilities

### New Capabilities

- `ticket-purchase-tracking`: a buyer-centric flow for marking other participants as having a ticket the current user purchased, with paid/unpaid tracking; a creator-only quick-add for new participants in the same flow; and per-participant display of the buyer + payment status.

### Modified Capabilities

_None._ The existing `concert-sharing` and (in-progress) `push-notifications` capabilities are untouched. The participant/ticket data model on `participations` is extended, not replaced.

## Impact

- **Data model:** two new optional fields on `participations`. Existing documents are unaffected and treated as "self-bought, paid" (no migration required).
- **Firestore security rules:** the existing `participations` rule that ties writes to `{concertId}_{uid}` ownership is relaxed for the new fields only. New rules:
  - any concert participant may update `hasTicket`, `ticketPurchasedBy`, `ticketPaid` on any participation for that concert, with `ticketPurchasedBy` (when present in the update) constrained to `request.auth.uid`.
  - the concert's creator may `create` a participation document for any uid on their concert.
- **Client code touched:**
  - `src/entities/participation/model/types.ts` — extend the type.
  - `src/entities/participation/api/participation.service.ts` — new methods: `bulkAssignTickets`, `markTicketPaid`, `unmarkTicketPaid`, `addParticipantByCreator`, `clearTicketPurchaser`.
  - `src/widgets/ticket-list/ticket-list.ui.tsx` — buyer panel + per-row buyer/paid annotations + entry button for the new modal.
  - new `src/features/ticket-purchase/` feature with the modal UI and submit logic.
  - `src/entities/user/api/user.service.ts` — add `listAll()` (or similar) so the creator quick-add section can enumerate users; alternatively scope to users who have ever joined any concert (= known friends) to avoid surfacing strangers.
- **No new env vars, no new Cloud Functions, no new dependencies.**
