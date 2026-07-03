## ADDED Requirements

### Requirement: Participation data model carries buyer and payment fields

The `participations` document SHALL support two optional fields in addition to the existing schema:

- `ticketPurchasedBy?: string` — Firebase Auth uid of the user who purchased this participant's ticket. If unset or equal to `userId`, the ticket is treated as self-bought.
- `ticketPaid?: boolean` — whether the participant has paid the buyer back. Only meaningful when `ticketPurchasedBy != userId`. If unset, treated as `false`.

#### Scenario: Existing participations without the new fields render as self-bought

- **WHEN** a participation document exists with `hasTicket = true` and no `ticketPurchasedBy` field
- **THEN** the UI renders the row as a normal ticketed entry
- **AND** no "gekauft von" annotation or paid/unpaid pill is shown

#### Scenario: Self-bought ticket suppresses paid/unpaid affordances

- **WHEN** `ticketPurchasedBy` equals the participation's own `userId`
- **THEN** the row renders identically to a participation without the field — no annotation, no pill

### Requirement: Buyer can bulk-assign tickets to other participants

The Tickets tab on the concert detail SHALL expose a buyer action "Tickets für andere gekauft". The action opens a modal listing existing participants who do not yet have a ticket. The buyer SHALL be able to select one or more of these participants, and on confirm each selected participation SHALL be updated to `hasTicket = true`, `ticketPurchasedBy = <buyer.uid>`, `ticketPaid = false`.

#### Scenario: Modal lists participants without tickets

- **WHEN** the buyer opens the modal
- **THEN** "Bereits dabei (ohne Ticket)" section lists every other participant of the concert whose participation has `hasTicket != true`
- **AND** the buyer's own participation is NOT listed (own tickets are handled by the existing toggle)

#### Scenario: Confirm updates each selected participation atomically

- **WHEN** the buyer selects participants `P1` and `P2` and taps "Tickets zuweisen"
- **THEN** a batched Firestore write sets `{ hasTicket: true, ticketPurchasedBy: <buyer.uid>, ticketPaid: false }` (merge) on both `participations/{concertId}_P1` and `participations/{concertId}_P2`
- **AND** the modal closes on success

#### Scenario: Empty selection does not enable submit

- **WHEN** the buyer has not checked any row
- **THEN** the "Tickets zuweisen" button is disabled

### Requirement: Concert creator can quick-add new participants while purchasing tickets

When the buyer is also the **concert creator**, the same modal SHALL additionally display a section "Weitere Teilnehmende hinzufügen" listing known friends (users with at least one historical participation) who are not yet participants of the current concert. Selecting from this section SHALL create a new participation document for that user and (because they were checked in this flow) mark the ticket as purchased by the creator.

#### Scenario: Creator sees the additional section

- **WHEN** a user who is the concert's `createdBy` opens the modal
- **THEN** below "Bereits dabei (ohne Ticket)" a section "Weitere Teilnehmende hinzufügen" is rendered

#### Scenario: Non-creator does not see the additional section

- **WHEN** a user who is NOT the concert's `createdBy` opens the modal
- **THEN** the "Weitere Teilnehmende hinzufügen" section is NOT rendered

#### Scenario: Quick-add creates a participation and assigns the ticket

- **WHEN** the creator checks user `D` in the additional section and submits
- **THEN** a new document is created at `participations/{concertId}_D` with `userId = D, isDriver = false, hasTicket = true, ticketPurchasedBy = <creator.uid>, ticketPaid = false`, `displayName` resolved from `users/D`, `joinedAt = now`

#### Scenario: Known-friends list excludes existing participants

- **WHEN** the creator opens the modal
- **THEN** the "Weitere Teilnehmende hinzufügen" section excludes uids that already have a participation for the current concert

### Requirement: Buyer payment overview panel

When the viewer has at least one participation for the current concert where they are listed as `ticketPurchasedBy` for someone else, the Tickets tab SHALL render a "Du hast Tickets gekauft" panel above the regular sections. The panel SHALL group covered participants into **Offen** (`ticketPaid != true`) and **Bezahlt** (`ticketPaid == true`).

#### Scenario: Panel is hidden when buyer has covered nobody

- **WHEN** there is no participation for the current concert with `ticketPurchasedBy == viewer.uid && userId != viewer.uid`
- **THEN** the panel is not rendered

#### Scenario: One-tap mark as paid

- **WHEN** the buyer taps the "Bezahlt" action on an open row
- **THEN** the corresponding participation's `ticketPaid` is set to `true`
- **AND** the row moves into the Bezahlt group within the live snapshot

#### Scenario: Mark-as-paid is reversible

- **WHEN** the buyer taps "Rückgängig" on a paid row
- **THEN** the corresponding participation's `ticketPaid` is set to `false`
- **AND** the row moves back into the Offen group

#### Scenario: Panel shows the per-ticket price

- **WHEN** the panel renders a row
- **THEN** the row shows the covered participant's display name and the amount `concert.price` formatted as Swiss francs (e.g., "CHF 45.00")

### Requirement: Per-row buyer and payment annotation

Each ticket row in the Tickets tab SHALL render — for both the buyer's and the debtor's view — an annotation "gekauft von {Buyer Name}" plus a paid/unpaid pill, whenever `ticketPurchasedBy` is set and differs from the row's `userId`.

#### Scenario: Debtor sees their own buyer/paid state

- **WHEN** the viewing user `D` has a participation with `ticketPurchasedBy = B, ticketPaid = false`
- **THEN** `D`'s own row shows "gekauft von {B's display name}" and an amber "Offen" pill
- **AND** the pill is read-only — `D` cannot toggle it

#### Scenario: Pill turns green when paid

- **WHEN** the buyer marks the row as paid
- **THEN** every viewer sees a green "Bezahlt" pill on that row within the live snapshot

### Requirement: Debtor can take ownership of their ticket

A user SHALL be able to clear `ticketPurchasedBy` (and any associated `ticketPaid`) on their own participation via a "Selbst gekauft" action. This is the only way to revert an assignment from the debtor's side.

#### Scenario: User clears their own buyer assignment

- **WHEN** user `D` has a participation with `ticketPurchasedBy = B`
- **AND** `D` taps "Selbst gekauft" on their own row and confirms the prompt
- **THEN** `ticketPurchasedBy` is removed from the participation
- **AND** `ticketPaid` is removed as well
- **AND** `B`'s payment overview panel no longer lists `D`

#### Scenario: Other users cannot use this action on someone else's row

- **WHEN** a user views a row that is not their own
- **THEN** the "Selbst gekauft" action is NOT shown

### Requirement: Security rules permit cross-user ticket writes within a concert

The Firestore security rules SHALL permit any signed-in participant of a concert to update only the `hasTicket`, `ticketPurchasedBy`, and `ticketPaid` fields on any participation document for that concert, subject to the constraint that `ticketPurchasedBy` (when present in the update) equals `request.auth.uid`. The rules SHALL additionally permit the concert's creator to create a participation document for any uid on their own concert.

#### Scenario: Participant updates another participant's ticket fields

- **WHEN** user `A` is a participant of concert `C`
- **AND** `A` issues an update to `participations/{C}_{B}` setting `{ hasTicket: true, ticketPurchasedBy: A, ticketPaid: false }`
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

#### Scenario: Concert creator creates a participation for another user

- **WHEN** user `A` is the creator of concert `C`
- **AND** `A` issues a create on `participations/{C}_{D}` with `userId = D, isDriver = false, hasTicket = true, ticketPurchasedBy = A`
- **THEN** the rule permits the write

#### Scenario: Non-creator attempts to create a participation for another user

- **WHEN** user `A` is NOT the creator of concert `C`
- **AND** `A` issues a create on `participations/{C}_{D}` (any field set)
- **THEN** the rule rejects the write
