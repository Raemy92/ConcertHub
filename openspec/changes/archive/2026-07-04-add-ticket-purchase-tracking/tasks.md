## 1. Data model

- [x] 1.1 Extend `Participation` in `src/entities/participation/model/types.ts` with `ticketPurchasedBy?: string`.
- [x] 1.2 Confirm no other code path treats `Participation` as a closed shape (no exhaustive switches / strict serializers) and adjust if so.

## 2. Firestore security rules

- [x] 2.1 Update `firestore.rules` for `match /participations/{partId}`:
  - keep existing own-doc create/delete/update rules (create/delete stay own-doc-only)
  - add: any concert participant may update only `hasTicket`, `ticketPurchasedBy` on any participation for that concert, with `ticketPurchasedBy` (when present in the update) constrained to `request.auth.uid`
- [x] 2.2 Deploy: `firebase deploy --only firestore:rules` — must land before the new UI is shipped.

> Rules unit tests for these relaxed participation writes are deferred to the `harden-firestore-writes` change, which stands up the emulator infrastructure and the rules-test suite.

## 3. Service methods

- [x] 3.1 Add `participationService.bulkAssignTickets(concertId, buyerUid, targetUids)`: for each `targetUid`, `setDoc(..., { hasTicket: true, ticketPurchasedBy: buyerUid }, { merge: true })`. Use a batched write for atomicity.
- [x] 3.2 Change `participationService.updateTicketStatus` so the owner's own toggle always clears the buyer link: `updateDoc(..., { hasTicket, ticketPurchasedBy: deleteField() })`. Setting one's own ticket to "have it" counts as a self-purchase; this replaces a dedicated "take ownership" method.

## 4. Buyer flow modal — `ticket-purchase` feature

- [x] 4.1 Create `src/features/ticket-purchase/ticket-purchase-modal.ui.tsx`. Trigger button "Tickets für andere gekauft" lives on the Tickets tab (see task 5.1).
- [x] 4.2 "Bereits dabei (ohne Ticket)": a single checklist of current `participations` for this concert where `hasTicket != true`. Exclude the buyer's own row. There is no section for adding non-participants.
- [x] 4.3 Submit button "Tickets zuweisen" — enabled if at least one row is checked. On submit call `bulkAssignTickets(concertId, user.uid, checkedUids)` and close the modal on success.
- [x] 4.4 Spinner / disabled state during in-flight; replace the button label with "Erledigt" for 1.5s before closing.
- [x] 4.5 Empty-state message when everyone already has a ticket ("Alle Teilnehmenden haben bereits ein Ticket.").

## 5. Tickets tab — UI integration

- [x] 5.1 In `src/widgets/ticket-list/ticket-list.ui.tsx`, add a "Tickets für andere gekauft" button that opens the modal from task 4.
- [x] 5.2 Per-row buyer annotation: if `ticketPurchasedBy && ticketPurchasedBy !== row.userId`, show below the name "gekauft von {displayName of buyer}" (buyer name resolved from the participation list).
- [x] 5.3 Make the Tickets tab read-only: remove the per-row click/toggle action entirely. Rows are pure display; changing one's own ticket happens on the Dabei tab.

## 6. Self-view annotation for the debtor

- [x] 6.1 The viewer's own row shows the same "gekauft von {buyer}" annotation as everyone else's view (no toggle, no pill) — it falls out of the shared row rendering in task 5.2.

## 7. End-to-end verification

- [x] 7.1 User A, users B and C as participants. A opens the modal, checks B and C, submits → both B and C now show `hasTicket = true`, `ticketPurchasedBy = A`.
- [x] 7.2 B opens the concert on their device → B's row shows "gekauft von A". C's row shows "gekauft von A" for every viewer.
- [x] 7.3 The modal offers only current participants — there is no section for adding non-participants, even when the viewer is the concert creator.
- [x] 7.4 C toggles their own ticket on the Dabei tab → `ticketPurchasedBy` clears; C's row no longer shows "gekauft von A".
- [x] 7.5 Tapping a row on the Tickets tab does nothing (read-only).
- [x] 7.6 Non-participant user E tries (via direct Firestore client) to update B's `hasTicket` field → rule rejects.
- [x] 7.7 Any user (creator or not) tries to create a participation doc for someone else → rule rejects.

## 8. Docs

- [x] 8.1 Add a "Ticket purchase tracking" subsection to `CLAUDE.md` covering the new field, the relaxed update rule, the bulk-assign flow (limited to current participants), and the self-purchase-via-toggle behaviour.
