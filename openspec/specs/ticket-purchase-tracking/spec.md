# ticket-purchase-tracking Specification

## Purpose

Track who bought each concert ticket within a small trusted friend group, so that when one person fronts the money for several tickets everyone can see "gekauft von {buyer}". One optional `ticketPurchasedBy` field on `participations` records the buyer; there is deliberately no paid/unpaid state — settling money is left to the group. Buyers bulk-assign tickets to existing participants via the read-only Tickets tab; a participant reclaims their own ticket by toggling it on the Dabei tab (which counts as a self-purchase). Firestore rules permit any participant of a concert to write only the `hasTicket`/`ticketPurchasedBy` fields on that concert's participations, constrained so a caller can only name themselves as buyer.

## Requirements

### Requirement: Participation data model carries a buyer field

The `participations` document SHALL support one optional field in addition to the existing schema:

- `ticketPurchasedBy?: string` — Firebase Auth uid of the user who purchased this participant's ticket. If unset or equal to `userId`, the ticket is treated as self-bought.

There is no paid/unpaid state — the app records only who bought a ticket, not whether it has been paid back.

#### Scenario: Existing participations without the field render as self-bought

- **WHEN** a participation document exists with `hasTicket = true` and no `ticketPurchasedBy` field
- **THEN** the UI renders the row as a normal ticketed entry
- **AND** no "gekauft von" annotation is shown

#### Scenario: Self-bought ticket suppresses the annotation

- **WHEN** `ticketPurchasedBy` equals the participation's own `userId`
- **THEN** the row renders identically to a participation without the field — no annotation

### Requirement: Buyer can bulk-assign tickets to other participants

The Tickets tab on the concert detail SHALL expose a buyer action "Tickets für andere gekauft". The action opens a modal listing existing participants who do not yet have a ticket. The buyer SHALL be able to select one or more of these participants, and on confirm each selected participation SHALL be updated to `hasTicket = true`, `ticketPurchasedBy = <buyer.uid>`.

#### Scenario: Modal lists participants without tickets

- **WHEN** the buyer opens the modal
- **THEN** "Bereits dabei (ohne Ticket)" section lists every other participant of the concert whose participation has `hasTicket != true`
- **AND** the buyer's own participation is NOT listed (own tickets are handled on the Dabei tab)

#### Scenario: Confirm updates each selected participation atomically

- **WHEN** the buyer selects participants `P1` and `P2` and taps "Tickets zuweisen"
- **THEN** a batched Firestore write sets `{ hasTicket: true, ticketPurchasedBy: <buyer.uid> }` (merge) on both `participations/{concertId}_P1` and `participations/{concertId}_P2`
- **AND** the modal closes on success

#### Scenario: Empty selection does not enable submit

- **WHEN** the buyer has not checked any row
- **THEN** the "Tickets zuweisen" button is disabled

### Requirement: Buying is limited to current participants

The buyer modal SHALL only offer participants who already have a participation document for the current concert. There is no flow to add a non-participant while purchasing — a person joins the concert themselves before a ticket can be bought for them.

#### Scenario: Modal offers only existing participants

- **WHEN** the buyer opens the modal
- **THEN** only users with a participation for the current concert (and without a ticket) are listed
- **AND** no section for adding non-participants is shown, regardless of whether the viewer is the concert creator

### Requirement: Per-row buyer annotation

Each ticket row in the Tickets tab SHALL render an annotation "gekauft von {Buyer Name}" whenever `ticketPurchasedBy` is set and differs from the row's `userId`. The buyer name is resolved from the concert's participation list.

#### Scenario: Row bought by someone else shows the buyer

- **WHEN** a participation has `ticketPurchasedBy = B` where `B != userId`
- **THEN** the row shows "gekauft von {B's display name}"

#### Scenario: Debtor sees the same annotation on their own row

- **WHEN** the viewing user `D` has a participation with `ticketPurchasedBy = B`
- **THEN** `D`'s own row shows "gekauft von {B's display name}" — identical to how other viewers see it

### Requirement: Tickets tab is read-only

The Tickets tab SHALL present participants purely for display. Rows SHALL NOT be clickable and SHALL expose no per-row toggle or action. Changing a ticket status is done elsewhere: a participant toggles their own ticket on the Dabei tab, and tickets for others are assigned through the "Tickets für andere gekauft" modal.

#### Scenario: Tapping a ticket row does nothing

- **WHEN** a user taps any participant row on the Tickets tab
- **THEN** no write occurs and no state changes

### Requirement: Toggling one's own ticket counts as a self-purchase

When a user sets their own `hasTicket` (via the Dabei tab toggle), the write SHALL clear any `ticketPurchasedBy` on that participation. Setting "Ich habe mein Ticket" means the user got the ticket themselves; this is the mechanism by which a user takes a ticket back from a buyer.

#### Scenario: Turning on own ticket clears the buyer link

- **WHEN** user `D` has a participation with `ticketPurchasedBy = B`
- **AND** `D` toggles their own ticket on the Dabei tab
- **THEN** `ticketPurchasedBy` is removed from the participation
- **AND** `D`'s row no longer shows a "gekauft von" annotation for anyone

### Requirement: Security rules permit cross-user ticket writes within a concert

The Firestore security rules SHALL permit any signed-in participant of a concert to update only the `hasTicket` and `ticketPurchasedBy` fields on any participation document for that concert, subject to the constraint that `ticketPurchasedBy` (when present in the update) equals `request.auth.uid`. Creating and deleting participation documents remains restricted to the owning user (unchanged).

#### Scenario: Participant updates another participant's ticket fields

- **WHEN** user `A` is a participant of concert `C`
- **AND** `A` issues an update to `participations/{C}_{B}` setting `{ hasTicket: true, ticketPurchasedBy: A }`
- **THEN** the rule permits the write

#### Scenario: Participant attempts to set ticketPurchasedBy to someone else

- **WHEN** user `A` issues an update to `participations/{C}_{B}` setting `ticketPurchasedBy = X` where `X != A`
- **THEN** the rule rejects the write

#### Scenario: Participant attempts to update a non-ticket field on someone else's doc

- **WHEN** user `A` issues an update to `participations/{C}_{B}` setting `isDriver = true`
- **THEN** the rule rejects the write

#### Scenario: Non-participant attempts to update a ticket field

- **WHEN** user `E` is signed in but has no participation for concert `C`
- **AND** `E` issues an update to `participations/{C}_{B}` setting `hasTicket = true`
- **THEN** the rule rejects the write

#### Scenario: Creating a participation for another user is rejected

- **WHEN** user `A` (creator or not) issues a create on `participations/{C}_{D}` where `D != A`
- **THEN** the rule rejects the write — participants create only their own doc
