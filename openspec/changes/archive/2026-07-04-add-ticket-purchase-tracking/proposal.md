## Why

In a small friend group, one person often buys tickets for several friends at once — either because the venue has a per-order limit, the tickets are part of a bundle, or simply because someone happened to be at the right place at the right time. ConcertHub today only stores a per-user `hasTicket: boolean`, with no notion of **who bought it for whom**. The result: double-bookings and confusion over who still needs a ticket.

A small extension to the `participations` data model — plus two focused UI flows — fixes this and keeps everything inside the app. The app records only _who bought_ a ticket; settling money stays outside the app (kept deliberately simple to avoid a confusing paid/unpaid state).

## What Changes

- Extend `Participation` with one optional field:
  - `ticketPurchasedBy?: string` — uid of the user who actually purchased the ticket. Unset (or equal to `userId`) means the user bought it themselves.
- Add a new buyer flow on the concert detail "Tickets" tab: **"Tickets für andere gekauft"**. Opens a modal listing the current participants who do not yet have a ticket; the buyer checks the ones they bought tickets for, confirms, and the app marks each as `hasTicket = true`, `ticketPurchasedBy = <buyer.uid>`. Buying for someone who is not yet a participant is out of scope — they join the concert themselves first.
- On every ticket row bought for someone else, render a small annotation "gekauft von {Buyer Name}" — both the buyer and the debtor see it.
- The Tickets tab becomes read-only: rows are not clickable and carry no per-row action. A user changes **their own** ticket status on the Dabei tab as before; toggling one's own "Ich habe mein Ticket" on always clears `ticketPurchasedBy` (i.e. counts as a self-purchase), which is also how a user takes a ticket back from a buyer.
- Loosen security rules: participants of a concert SHALL be allowed to update the `hasTicket` and `ticketPurchasedBy` fields on any participation for the same concert, with the constraint that `ticketPurchasedBy`, if set, must equal `request.auth.uid` (you can only mark yourself as the buyer). Create/delete stay own-doc-only.

## Capabilities

### New Capabilities

- `ticket-purchase-tracking`: a buyer-centric flow for marking other participants as having a ticket the current user purchased, and per-participant display of who bought the ticket.

### Modified Capabilities

_None._ The existing `concert-sharing` and (in-progress) `push-notifications` capabilities are untouched. The participant/ticket data model on `participations` is extended, not replaced.

## Impact

- **Data model:** one new optional field on `participations`. Existing documents are unaffected and treated as "self-bought" (no migration required).
- **Firestore security rules:** the existing `participations` rule that ties writes to `{concertId}_{uid}` ownership is relaxed for updates only:
  - any concert participant may update `hasTicket`, `ticketPurchasedBy` on any participation for that concert, with `ticketPurchasedBy` (when present in the update) constrained to `request.auth.uid`.
  - create/delete remain own-doc-only (unchanged).
- **Client code touched:**
  - `src/entities/participation/model/types.ts` — extend the type.
  - `src/entities/participation/api/participation.service.ts` — new method `bulkAssignTickets`; `updateTicketStatus` now clears `ticketPurchasedBy` on the owner's toggle.
  - `src/widgets/ticket-list/ticket-list.ui.tsx` — read-only rows with per-row "gekauft von" annotation + entry button for the new modal.
  - new `src/features/ticket-purchase/` feature with the modal UI and submit logic.
- **No new env vars, no new Cloud Functions, no new dependencies.**
