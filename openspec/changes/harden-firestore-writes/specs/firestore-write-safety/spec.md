## ADDED Requirements

### Requirement: Server-owned timestamps on user-writable records

Every timestamp that clients write to Firestore for the purpose of ordering or auditing SHALL be a server-owned value. The client SHALL write it via Firebase's `serverTimestamp()` sentinel, and the Firestore security rules SHALL reject any write whose timestamp field does not equal `request.time`. The read path SHALL normalise the stored `Timestamp` to a ms epoch `number` at the service layer so the UI stays timestamp-agnostic.

Concretely, this applies to:

- `participations.joinedAt` (this change).
- `concerts/{cid}/comments/{commentId}.createdAt` and `.updatedAt` (already enforced by `add-concert-comments`; documented here as the reference pattern).

#### Scenario: A crafted client attempts to spoof `joinedAt`

- **WHEN** a signed-in client attempts to create a participation with `joinedAt: 9999999999999`
- **THEN** the Firestore rule rejects the write with a permission denied error
- **AND** no participation document is created

#### Scenario: A well-behaved client writes a server timestamp

- **WHEN** the participation service calls `setDoc` with `joinedAt: serverTimestamp()`
- **THEN** Firestore replaces the sentinel with the server-side time
- **AND** the value read back through `subscribeByConcert` is a ms epoch `number`

#### Scenario: Legacy numeric `joinedAt` values continue to render

- **WHEN** a participation predates this change and has `joinedAt` stored as a `number`
- **THEN** the read path returns it as-is without throwing
- **AND** the UI continues to sort and format it correctly

### Requirement: Concert ownership is immutable after creation

The Firestore security rules for `concerts/{concertId}` SHALL treat `createdBy` and `createdAt` as immutable after the initial create. An update by the current owner MAY change any other allowed field but SHALL NOT change either of these two.

#### Scenario: Owner attempts to transfer ownership by rewriting `createdBy`

- **WHEN** the concert's current `createdBy` submits an `updateDoc` that sets `createdBy` to another uid
- **THEN** the rule rejects the write
- **AND** the concert document keeps its original `createdBy`

#### Scenario: Owner edits allowed fields normally

- **WHEN** the current owner updates `band`, `location`, `date`, `notes`, or `isArchived`
- **THEN** the write is accepted
- **AND** `createdBy` and `createdAt` are unchanged in the resulting document

### Requirement: Writable field sets are locked on create

The Firestore security rules SHALL enumerate the writable fields at create time for `concerts`, `participations`, and comments, and SHALL reject any create write whose payload contains a key outside the enumerated set. This prevents a hand-crafted client from smuggling in unexpected fields (which might later be surfaced by future queries or rules).

For `participations`, the set is: `concertId`, `userId`, `displayName`, `hasTicket`, `isDriver`, `availableSeats`, `driverId`, `joinedAt`.

For `concerts`, the set is: the current concert model fields — `band`, `location`, `date`, `time` (optional), `price` (optional), `genres`, `notes` (optional), `createdBy`, `isArchived`, `createdAt`, `updatedAt` (optional). The exact list SHALL be kept in sync with `src/entities/concert/model/types.ts`.

For comments, the set is: `text`, `authorId`, `authorDisplayName`, `createdAt` (already enforced by `add-concert-comments`).

#### Scenario: Unknown field on participation create is rejected

- **WHEN** a client submits a participation create with `{ ..., foo: "bar" }` where `foo` is not in the allowed set
- **THEN** the Firestore rule rejects the write

#### Scenario: Unknown field on concert create is rejected

- **WHEN** a client submits a concert create with `{ ..., legacyField: 1 }` where `legacyField` is not in the allowed set
- **THEN** the Firestore rule rejects the write

#### Scenario: Adding a new field requires a rules update

- **WHEN** a code change introduces a new concert field
- **THEN** the developer MUST extend the allowed key set in `firestore.rules` in the same change
- **AND** the rules unit tests SHALL cover the new field

### Requirement: Firestore rules are covered by emulator-backed unit tests

Every Firestore security rule that gates a write SHALL be covered by at least one accept-path and one reject-path test running against the Firebase Emulator via `@firebase/rules-unit-testing`. The tests SHALL live under a scoped Vitest project and SHALL be runnable via `npm run test:rules`. The main `npm run test` SHALL continue to run without requiring the emulator, so contributors without Java installed can still run the unit suite.

#### Scenario: A rules change without a test is caught in review

- **WHEN** a developer changes `firestore.rules` without adding or updating a rules test
- **THEN** the review process flags the missing coverage (documented convention in `CLAUDE.md`)

#### Scenario: Emulator tests run standalone

- **WHEN** a contributor runs `npm run test:rules` with the emulator available
- **THEN** every rules test executes and reports pass / fail
- **AND** the developer does not need to have run `npm run test` first

#### Scenario: The default test suite does not require Java

- **WHEN** a contributor without Java installed runs `npm run test`
- **THEN** the suite executes and passes, without pulling in any emulator-backed tests

### Requirement: Comment rules are covered by the emulator suite

The comment rules that shipped in `add-concert-comments` (creator/participant gate on create, immutable `authorId`/`createdAt`/`authorDisplayName` on update, delete denied, text length bounds, server-owned timestamps, locked field set) SHALL each be covered by a corresponding emulator test in this change.

#### Scenario: Every comment rule branch has coverage

- **WHEN** the emulator test suite runs
- **THEN** at minimum there is a passing test for each of:
  - accept: participant create, creator create, author edit, edit after leaving participation
  - reject: non-participant create, spoofed `createdAt`, unknown field on create, empty / oversized text, non-author edit, forbidden field changes on edit, any delete

### Requirement: Participation update rule stays intentionally flexible

The `participations` update rule SHALL retain its two-branch structure: the owning user may modify any field on their own document, and any signed-in user may modify a document if the write only changes the `driverId` field (used for the carpool assignment/leave flow). This requirement freezes the current behaviour explicitly so future hardening does not accidentally break the carpool feature.

#### Scenario: Owner toggles own `hasTicket`

- **WHEN** the owning user calls `updateTicketStatus` on their own participation
- **THEN** the write is accepted

#### Scenario: Non-owner clears `driverId` on someone else's participation

- **WHEN** a driver leaves the concert, causing `driverId: null` writes on their passengers' documents
- **THEN** the writes are accepted because they only touch the `driverId` field

#### Scenario: Non-owner cannot change any other field

- **WHEN** a non-owner attempts to change `hasTicket` on someone else's participation
- **THEN** the rule rejects the write
