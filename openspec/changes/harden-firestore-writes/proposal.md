## Why

A code review of the concert-comments work surfaced a few small write-side gaps that also exist in the pre-existing Firestore surface:

- `participations.joinedAt` is written with `Date.now()` on the client. A manipulated client can put arbitrary values there and skew any future joined-at ordering.
- The `concerts` update rule does not pin `createdBy`. A creator can — accidentally or maliciously — set `createdBy` to another uid during an update and hand ownership away with no recovery path (delete is `false`).
- The `concerts` and `participations` update rules do not restrict the key set of a write. New / unexpected fields can be added by a hand-crafted client.

None of these is exploitable at meaningful scale for a 12-person friend group, but each is a small, cheap fix that hardens the Firestore surface and matches what `add-concert-comments` already introduced for comments (server timestamps, `keys().hasOnly()`, `diff().affectedKeys().hasOnly()`). Landing them as a separate change keeps the changelog honest — this is a `fix`/`chore` block, not a feature.

## What Changes

- **Server timestamps for `participations.joinedAt`**: the participation service SHALL write `joinedAt` via `serverTimestamp()`; the Firestore rule SHALL enforce `request.resource.data.joinedAt == request.time` on create.
- **Immutable `createdBy` on `concerts`**: the update rule SHALL require `request.resource.data.createdBy == resource.data.createdBy`, preventing ownership transfer.
- **Locked field set on `concerts` create/update**: the create rule SHALL `keys().hasOnly([...])` the known-good field set; the update rule SHALL constrain `diff().affectedKeys()` accordingly. No new fields can be introduced by an unknown client.
- **Locked field set on `participations` create**: same treatment. Update stays flexible for the `driverId`-only cross-user write already permitted.
- The comment rules already have this shape and are the reference for the pattern.
- **Firebase Emulator infrastructure**: add `@firebase/rules-unit-testing`, an `emulators` block in `firebase.json`, a test helper that boots a `RulesTestEnvironment`, and a `npm run test:rules` entrypoint. This is a one-time setup that every future rules change reuses.
- **Rules unit tests** for the new hardening (concerts + participations) **and** the comment rules that shipped without automated coverage in `add-concert-comments` (creator/participant gate, immutable fields on edit, delete denied, length bounds, server timestamps).
- **Lightweight service integration tests** for `commentService` (post writes correct shape, subscribe orders ascending, edit preserves `createdAt`).

## Capabilities

### New Capabilities

- `firestore-write-safety`: a small set of invariants the Firestore rules SHALL enforce across the write surface — server-owned timestamps, immutable ownership fields, and locked field sets — so that write payloads cannot be crafted to bypass client-side conventions.

### Modified Capabilities

_None._ This is a purely defensive change; no user-facing behaviour changes. Existing archived specs stay as they are.

## Impact

- **Firestore rules:** `match /concerts/{concertId}` and `match /participations/{participationId}` get tighter create/update conditions.
- **Client code:** `src/entities/participation/api/participation.service.ts` switches `Date.now()` → `serverTimestamp()` for `joinedAt` and converts the returned `Timestamp` to ms on read (mirroring what `comment.service.ts` does).
- **Types:** `Participation.joinedAt` stays `number` (ms epoch) for the UI; only the write path and rule shape change.
- **Test infrastructure:** new dev dependency `@firebase/rules-unit-testing`; an `emulators` block in `firebase.json`; a scoped Vitest project for emulator-backed rules and service tests. Contributors will need Java installed to run `npm run test:rules`; `npm run test` continues to work without.
- **No new collections, no new fields, no new Cloud Functions, no new env vars.**
- **Migration:** none. Old participations keep their existing numeric `joinedAt`; the read path already tolerates both `Timestamp` and `number`.
