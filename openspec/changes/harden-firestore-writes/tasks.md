## 1. Participations: server-owned `joinedAt`

- [ ] 1.1 In `src/entities/participation/api/participation.service.ts`, replace `joinedAt: Date.now()` in `join()` with `joinedAt: serverTimestamp()` and remove any dependency on the returned value's `joinedAt` at the call sites (or update them to await a fresh subscribe cycle).
- [ ] 1.2 Update `subscribeByConcert` (and any other read path) to convert `Timestamp | number | undefined` values on `joinedAt` to a ms epoch `number`, mirroring the `toMillis` helper used in `comment.service.ts`.
- [ ] 1.3 Leave `Participation.joinedAt: number` unchanged in `src/entities/participation/model/types.ts` — only the write path and read conversion change.
- [ ] 1.4 In `firestore.rules`, under `match /participations/{participationId}`, add to the create rule:
  - `request.resource.data.joinedAt == request.time`
  - `request.resource.data.keys().hasOnly([...])` with the exact known field set (`concertId`, `userId`, `displayName`, `hasTicket`, `isDriver`, `availableSeats`, `driverId`, `joinedAt` — verify against the current model).
- [ ] 1.5 Do NOT tighten the update rule — its two-branch structure is intentional; see design Decision 4.

## 2. Concerts: pin `createdBy`, lock field set

- [ ] 2.1 In `firestore.rules`, under `match /concerts/{concertId}`, extend the create rule with `request.resource.data.keys().hasOnly([...])` using the exact concert field list (`band`, `location`, `date`, `time?`, `price?`, `genres`, `notes?`, `createdBy`, `isArchived`, `createdAt`, `updatedAt?` — verify against the current model).
- [ ] 2.2 Extend the update rule with:
  - `request.resource.data.createdBy == resource.data.createdBy` (pin ownership)
  - `request.resource.data.createdAt == resource.data.createdAt` (pin creation time)
  - `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])` — the same allowed key set minus the pinned ones.

## 3. Firebase Emulator infrastructure (foundational)

This section stands up the emulator infrastructure that the rules-unit-test discipline requires. It is a one-time investment; every later rules change reuses it.

- [ ] 3.1 Add `@firebase/rules-unit-testing` as a dev dependency.
- [ ] 3.2 Extend `firebase.json` with an `emulators` block (at minimum `firestore` on a fixed port; `singleProjectMode: false` if we want isolated project ids per test file).
- [ ] 3.3 Add a Vitest test project (or a scoped folder like `.test/firebase/`) with a helper that boots a `RulesTestEnvironment` bound to the local emulator. Document the Java requirement in `CLAUDE.md` under a new "Firebase Emulator" subsection.
- [ ] 3.4 Add an npm script `test:rules` that:
  - Starts the Firestore emulator (`firebase emulators:exec --only firestore "vitest run <rules-tests>"`), OR
  - Assumes the emulator is running and just runs the relevant Vitest files (cheaper local iteration).
    Pick whichever fits the existing `npm run test` UX best — probably the `emulators:exec` pattern for CI and a plain runner for local.
- [ ] 3.5 Ensure the main `npm run test` still runs cleanly without an emulator (the rules tests must be isolated so a developer without Java can still run the unit suite).

## 4. Rules unit tests — concerts + participations (this change)

- [ ] 4.1 Test: participation `create` with a client-forged `joinedAt` (e.g., `9999999999999`) is rejected.
- [ ] 4.2 Test: participation `create` with an extra unknown field is rejected.
- [ ] 4.3 Test: participation `create` with the correct field set and `serverTimestamp()` for `joinedAt` is accepted.
- [ ] 4.4 Test: concert `update` attempting to change `createdBy` is rejected — even when performed by the current creator.
- [ ] 4.5 Test: concert `update` that changes only allowed fields (e.g., `band`, `location`, `notes`) is accepted.
- [ ] 4.6 Test: concert `create` with an extra unknown field is rejected.
- [ ] 4.7 Test: participation `update` still allows the two-branch structure — owner can flip `hasTicket`; a non-owner can only touch `driverId`.

## 5. Rules unit tests — comments (rolled in from `add-concert-comments`)

The comment rules landed in the previous change without automated coverage. Now that the emulator infrastructure is in place, close that gap here.

- [ ] 5.1 Test: comment `create` by a signed-in participant is accepted; `authorId == request.auth.uid` and `createdAt == request.time` (via `serverTimestamp()`).
- [ ] 5.2 Test: comment `create` by the concert's creator (even without a participation doc) is accepted.
- [ ] 5.3 Test: comment `create` by a signed-in non-participant / non-creator is rejected.
- [ ] 5.4 Test: comment `create` with a spoofed `createdAt` (`9999999999999`) is rejected.
- [ ] 5.5 Test: comment `create` with an extra unknown field is rejected.
- [ ] 5.6 Test: comment `create` with `text.size() == 0` and with `text.size() > 2000` are both rejected.
- [ ] 5.7 Test: comment `update` by the author changing only `text` and `updatedAt` (server timestamp) is accepted.
- [ ] 5.8 Test: comment `update` by a non-author is rejected.
- [ ] 5.9 Test: comment `update` that attempts to change `authorId`, `createdAt`, or `authorDisplayName` is rejected.
- [ ] 5.10 Test: comment `update` where an author's participation has since been deleted is **still accepted** for their own past comment (edit is not re-gated on participation).
- [ ] 5.11 Test: comment `delete` by anyone (including the author) is rejected.

## 6. Service integration tests — comments (rolled in from `add-concert-comments`)

Lightweight coverage that the service and rules line up end-to-end. Not exhaustive — focus on the shape of the write, not on UI behaviour.

- [ ] 6.1 Test: `commentService.post` writes `text`, `authorId`, `authorDisplayName`, and a `Timestamp` in `createdAt`. Verify by reading the doc back.
- [ ] 6.2 Test: `commentService.subscribeByConcert` yields comments ordered by `createdAt` ascending across multiple writes.
- [ ] 6.3 Test: `commentService.edit` sets `text` and a fresh `updatedAt` while leaving `createdAt` unchanged.

## 7. Verification

- [ ] 7.1 `npx tsc --noEmit` clean.
- [ ] 7.2 `npm run lint` clean.
- [ ] 7.3 `npm run test` clean (the non-emulator suite still passes on a machine without Java).
- [ ] 7.4 `npm run test:rules` clean with the emulator running.
- [ ] 7.5 Manual staging smoke after rule deploy: join a concert (server-side `joinedAt` visible in Firestore Console), edit a concert (fields save, `createdBy` unchanged), post a comment (server-side `createdAt`).

## 8. Deploy

- [ ] 8.1 Ship the client change first (`participation.service.ts` uses `serverTimestamp()` and tolerant read).
- [ ] 8.2 Deploy rules: `firebase deploy --only firestore:rules` to staging.
- [ ] 8.3 Watch Firestore rules logs for a day for unexpected denies.

## 9. Docs

- [ ] 9.1 Update `CLAUDE.md`'s "Key domain concepts" bullet on Participation to note that `joinedAt` is server-owned, mirroring the note that comment timestamps carry.
- [ ] 9.2 Add a one-liner to the CLAUDE.md rules note about `createdBy` immutability and the concert key list.
- [ ] 9.3 Add a "Firebase Emulator" subsection to `CLAUDE.md` covering the Java requirement, `npm run test:rules`, and where the rules-test files live.
