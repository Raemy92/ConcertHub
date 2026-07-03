## 1. Data model

- [ ] 1.1 Extend `Participation` in `src/entities/participation/model/types.ts` with `ticketPurchasedBy?: string` and `ticketPaid?: boolean`.
- [ ] 1.2 Confirm no other code path treats `Participation` as a closed shape (no exhaustive switches / strict serializers) and adjust if so.

## 2. Firestore security rules

- [ ] 2.1 Update `firestore.rules` for `match /participations/{partId}`:
  - keep existing own-doc create/delete/update rules
  - add: creator may create participation docs for any uid on their own concert, with `ticketPurchasedBy` either unset or equal to `request.auth.uid`
  - add: any concert participant may update only `hasTicket`, `ticketPurchasedBy`, `ticketPaid` on any participation for that concert, with `ticketPurchasedBy` (when present in the update) constrained to `request.auth.uid`
- [ ] 2.2 Write rules unit tests covering the matrix in design.md Decision 3.
- [ ] 2.3 Deploy: `firebase deploy --only firestore:rules` — must land before the new UI is shipped.

## 3. Service methods

- [ ] 3.1 Add `participationService.bulkAssignTickets(concertId, buyerUid, targetUids)`: for each `targetUid` in `targetUids`, `setDoc(..., { hasTicket: true, ticketPurchasedBy: buyerUid, ticketPaid: false }, { merge: true })`. Use a batched write for atomicity.
- [ ] 3.2 Add `participationService.markTicketPaid(concertId, participantUid, paid: boolean)`: `updateDoc(..., { ticketPaid: paid })`.
- [ ] 3.3 Add `participationService.clearTicketPurchaser(concertId, ownUid)`: `updateDoc(..., { ticketPurchasedBy: deleteField(), ticketPaid: deleteField() })`. Caller must be the participant themselves (UI guard; rule already enforces).
- [ ] 3.4 Add `participationService.addParticipantByCreator(concertId, creatorUid, newParticipantUid, { withTicket })`: builds a fresh participation doc for `newParticipantUid` with `isDriver: false`, optionally `hasTicket: true, ticketPurchasedBy: creatorUid, ticketPaid: false`. Resolves the new participant's display name via the existing `resolveUserDisplayName` helper.
- [ ] 3.5 Add `userService.listKnownFriends()` returning unique uids that appear in any participation doc, joined with `users/{uid}` for display name + photo. Sort by display name ascending.

## 4. Buyer flow modal — `ticket-purchase` feature

- [ ] 4.1 Create `src/features/ticket-purchase/ticket-purchase-modal.ui.tsx`. Trigger button "Tickets für andere gekauft" lives on the Tickets tab (see task 5.1).
- [ ] 4.2 Section A — "Bereits dabei (ohne Ticket)": checklist of current `participations` for this concert where `hasTicket != true`. Exclude the buyer's own row (their own ticket is handled separately via the existing toggle).
- [ ] 4.3 Section B — "Weitere Teilnehmende hinzufügen": rendered only when `concert.createdBy === user.uid`. Lists known friends (from `userService.listKnownFriends()`) who are NOT already in `participations` for this concert. Each row is a checkbox.
- [ ] 4.4 Submit button "Tickets zuweisen" — enabled if at least one row is checked. On submit:
  - call `bulkAssignTickets(concertId, user.uid, checkedExistingUids)` if section A rows are checked
  - for each checked section B row, call `addParticipantByCreator(concertId, user.uid, uid, { withTicket: true })`
  - close the modal on success
- [ ] 4.5 Spinner / disabled state during in-flight; toast on completion (or, if no toast system, replace the button label with "Erledigt" for 1.5s before closing — matches existing patterns).
- [ ] 4.6 Empty-state messages for each section ("Alle Teilnehmenden haben bereits ein Ticket." / "Alle bekannten Personen sind schon dabei.").

## 5. Tickets tab — UI integration

- [ ] 5.1 In `src/widgets/ticket-list/ticket-list.ui.tsx`, add a "Tickets für andere gekauft" button beneath the section headers (or top-right of the tab, mirroring the existing layout). Opens the modal from task 4.
- [ ] 5.2 Per-row buyer annotation:
  - If `ticketPurchasedBy && ticketPurchasedBy !== row.userId`, show below the name "gekauft von {displayName of buyer}".
  - Show a small pill: green "Bezahlt" when `ticketPaid === true`, amber "Offen" otherwise. Pill is read-only here.
- [ ] 5.3 Per-row "Selbst gekauft" action: visible only on the viewer's own row when `ticketPurchasedBy && ticketPurchasedBy !== user.uid`. Tapping calls `clearTicketPurchaser` after a confirm dialog ("Diesen Eintrag selbst übernehmen? Der Käufer sieht ihn dann nicht mehr in seiner Übersicht.").

## 6. Buyer payment overview panel

- [ ] 6.1 Compute `coveredByMe = participations.filter(p => p.ticketPurchasedBy === user.uid && p.userId !== user.uid)` inside `ticket-list.ui.tsx`.
- [ ] 6.2 If `coveredByMe.length > 0`, render a panel at the top of the Tickets tab titled "Du hast Tickets gekauft":
  - **Offen** group: rows where `ticketPaid !== true`. Each row: avatar + name + "CHF {concert.price.toFixed(2)}" + a primary "Bezahlt" action button.
  - **Bezahlt** group: rows where `ticketPaid === true`. Each row: avatar + name + small "Rückgängig" link that reverts.
- [ ] 6.3 Both actions call `markTicketPaid(concertId, row.userId, true|false)`.
- [ ] 6.4 Panel collapses below the section headers when `coveredByMe.length === 0` (i.e., do not render).

## 7. Self-view annotation for the debtor

- [ ] 7.1 In the viewer's own row (across both "Hat Ticket" / "Wartet auf Ticket" sections), when `ticketPurchasedBy && ticketPurchasedBy !== user.uid`, render the same "gekauft von {buyer}" + paid/unpaid pill as in task 5.2 (no toggle here — debtor cannot mark themselves paid; only the buyer confirms).

## 8. End-to-end verification

- [ ] 8.1 User A (creator), users B and C as participants. A opens the modal, checks B and C in section A, submits → both B and C now show `hasTicket = true`, `ticketPurchasedBy = A`, `ticketPaid = false`.
- [ ] 8.2 A sees the "Du hast Tickets gekauft" panel with B and C under "Offen". A marks B as paid → B moves to "Bezahlt".
- [ ] 8.3 B opens the concert on their device → sees the row with "gekauft von A" + "Bezahlt" pill. C sees "gekauft von A" + "Offen" pill.
- [ ] 8.4 As creator, A opens the modal again. Section B lists known friend D (not yet a participant). A checks D, submits → a new participation doc is created for D with `hasTicket = true, ticketPurchasedBy = A`. D appears in the Dabei tab and the Tickets tab.
- [ ] 8.5 C taps "Selbst gekauft" on their own row, confirms → `ticketPurchasedBy` clears. C disappears from A's "Du hast Tickets gekauft" panel.
- [ ] 8.6 Non-participant user E tries (via direct Firestore client) to update D's `hasTicket` flag → rule rejects. Verified in rules unit test.
- [ ] 8.7 A non-creator participant tries to create a participation doc for someone else → rule rejects.

## 9. Docs

- [ ] 9.1 Add a "Ticket purchase tracking" subsection to `CLAUDE.md` covering the new fields, the relaxed write rules, and the two flows (bulk-assign + creator-quick-add).
