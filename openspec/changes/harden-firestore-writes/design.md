## Context

`add-concert-comments` introduced three hardening patterns on the comment subcollection:

1. `createdAt` / `updatedAt` are `serverTimestamp()`; the rule enforces `== request.time`.
2. Create allows only a fixed field list via `request.resource.data.keys().hasOnly([...])`.
3. Update allows only a fixed set of key changes via `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])`.

The `concerts` and `participations` rules pre-date these patterns and do not enforce them. This change closes those gaps for the fields that most benefit — timestamps and ownership.

The scope is intentionally narrow. `users` and `users/{uid}/fcmTokens` already have simple, correct ownership rules; nothing to fix there.

`add-concert-comments` also **shipped without automated rules or service tests** — those were deferred pending the emulator infrastructure. Since this change is the natural place to introduce that infrastructure (its own hardening also needs rules-unit-test coverage), the comment tests are rolled in here rather than retrofitted into the archived comment change.

## Goals / Non-Goals

**Goals:**

- Prevent client-crafted timestamp values on `participations.joinedAt` (matching the pattern already in place for comments).
- Prevent ownership transfer on `concerts` by pinning `createdBy` in the update rule.
- Prevent unknown-field injection by locking the writable field set on `concerts` and `participations`.
- Stand up a reusable Firebase Emulator + `@firebase/rules-unit-testing` setup so every rules change from now on can ship with automated coverage. Retrofit the missing comment-rules coverage as the first user of the new infrastructure.

**Non-Goals:**

- Anything user-facing. There are no UI changes and no new preferences.
- `authorDisplayName` spoofing on comment create at the rule level — would need a cross-doc `get()` and is out of proportion for a 12-person friend group; the client already resolves it from the users doc.
- Registration allowlisting. Deciding who is allowed into the app is a bigger, separate policy question and not a Firestore-rule fix.
- Migration of existing `joinedAt` numbers. The read path is tolerant.

## Decisions

### Decision 1: Server timestamp for `joinedAt`, tolerant read

**Choice:** Write `joinedAt` via `serverTimestamp()`; the read path converts `Timestamp | number | undefined` to a ms epoch number. New writes get server-owned time; old numeric values continue to render.

**Why:** Same approach comment.service.ts already uses. No migration, no dual-write, no versioning field.

**Trade-off:** For a brief window after a client-side write, the local snapshot has an estimated timestamp (`serverTimestamps: 'estimate'`). Once the server confirms, a second snapshot arrives with the authoritative value. This is Firestore's standard behaviour and is invisible to the UI.

### Decision 2: Pin `createdBy` in the concerts update rule

**Choice:** Add `request.resource.data.createdBy == resource.data.createdBy` to the concerts update rule.

**Why:** The current rule only gates who can update (must be current creator). It does not prevent that user from setting `createdBy` to a different uid inside the same update. Given `delete: false`, a mistaken transfer is unrecoverable.

**Alternative considered:** Allowing an explicit "transfer ownership" flow. Rejected as YAGNI — there is no product ask.

### Decision 3: `keys().hasOnly()` on concerts create; `diff().affectedKeys().hasOnly()` on concerts update

**Choice:** The concert create rule shall enumerate the allowed keys. The update rule shall constrain which keys may change, and never allow `id` or `createdBy` to be added/removed/changed.

**Why:** Same shape as the comment rules. Blocks unexpected fields from ever reaching the schema; makes it obvious in the rules what the write surface is.

**Trade-off:** Adding a new concert field means updating the rule. That is a **desired** friction — it keeps schema drift honest.

### Decision 4: Only tighten `participations` create; leave update alone

**Choice:** The participation create rule gets `keys().hasOnly([...])`. The update rule is **not** narrowed further, because it already carries the intentional two-branch structure (owner may change anything on their own doc; anyone may change only `driverId` on any doc) that the carpool feature depends on.

**Why:** Narrowing the update rule with `diff().affectedKeys()` on top of the existing branches would be error-prone for no gain — the two branches already control the surface. Only the create surface benefits from a strict key list.

### Decision 5: Emulator infrastructure lands here, not in a separate change

**Choice:** Introduce `@firebase/rules-unit-testing`, the `firebase.json` emulators block, and a scoped Vitest project as part of this change — rather than spinning up a dedicated "add-emulator-infra" change first.

**Why:** The infrastructure has three simultaneous customers (concert rules tests, participation rules tests, comment rules tests). Setting it up as a standalone change would land an unused framework for a beat; landing it with real users is cleaner and avoids review overhead.

**Trade-off:** This change gets a little bigger. Mitigation: the emulator-related work is scoped into its own tasks section and a design section (Decision 6), and the deploy is unaffected — rules ship independently of the test setup.

### Decision 6: Rules tests live in a scoped project, not in the default `npm test`

**Choice:** Add a separate `npm run test:rules` script that either uses `firebase emulators:exec` (CI) or assumes a running emulator (local iteration). The main `npm run test` continues to run the existing Vitest suite **without** the emulator.

**Why:** Not every contributor has Java installed; forcing the whole suite to require it would break local iteration for contributors touching UI code. Keeping the rules tests scoped preserves the fast, Java-free path for everyone else.

**Trade-off:** Contributors who touch rules must remember to run `npm run test:rules`. Mitigation: document in `CLAUDE.md`, and (later, out of scope for this change) add a CI step that runs both.

## Risks / Trade-offs

- **Rules read/write cost is unchanged**; `keys().hasOnly()` and `diff().affectedKeys().hasOnly()` are cheap primitives evaluated locally in the rule engine.
- **Any client that today writes an undocumented field to `concerts` or `participations` will start failing** after these rules ship. Mitigation: the codebase only writes the documented field set — confirmed by inspection of the two services. There is no third-party writer.
- **Existing `joinedAt` values remain numbers.** The read path handles both; no backfill needed.

## Migration

- No data migration required.
- Rules ship independently of client code. Deploy order:
  1. Ship client change to `participation.service.ts` (server timestamp on new writes, tolerant read).
  2. Deploy new rules.
  3. Verify in staging.
- Rolling back is safe — old rules accept everything the new client sends (server timestamps are still `Timestamp` values, which the old rule permits).
