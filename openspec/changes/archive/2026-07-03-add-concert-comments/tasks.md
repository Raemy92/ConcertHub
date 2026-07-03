## 1. Data model & Firestore rules

- [x] 1.1 Create `src/entities/comment/model/types.ts` exporting `Comment` with fields `{ id?, text, authorId, authorDisplayName, createdAt, updatedAt? }`.
- [x] 1.2 Create `src/entities/comment/index.ts` re-exporting the type and the service.
- [x] 1.3 Extend `firestore.rules`: under `match /concerts/{concertId}` add a nested `match /comments/{commentId}` block with:
  - `allow read: if request.auth != null`
  - `allow create`: caller must be the author; `keys().hasOnly(['text','authorId','authorDisplayName','createdAt'])`; text 1..2000; `createdAt == request.time` (server timestamp enforced); caller is either concert creator or has a participation doc.
  - `allow update`: caller is the original author; `diff().affectedKeys().hasOnly(['text','updatedAt'])`; text 1..2000; `updatedAt == request.time`.
  - `allow delete: if false`
- [ ] 1.4 ~~Deploy rules locally to the Firebase emulator and write a rules unit test covering the four scenarios above.~~ Deferred — rolled into `harden-firestore-writes`, which sets up the emulator infrastructure and adds coverage for concerts, participations, **and** comments in one place.
- [x] 1.5 Deploy rules to staging via `firebase deploy --only firestore:rules`. (Prod deploy is out of scope for this change — the staging env is the shipping target for the friend-group PWA.)

## 2. Comments service

- [x] 2.1 Create `src/entities/comment/api/comment.service.ts` exporting `commentService` with:
  - `subscribeByConcert(concertId, callback)` — `onSnapshot` ordered by `createdAt` ascending; converts Firestore `Timestamp` values to ms epoch numbers for the UI.
  - `post({ concertId, authorId, authorDisplayName, text })` — `addDoc` with `createdAt: serverTimestamp()`; throws on empty / too-long text.
  - `edit({ concertId, commentId, text })` — `updateDoc` setting `text` and `updatedAt: serverTimestamp()`.
- [x] 2.2 Use `userService.resolveDisplayName` (shared helper on the user entity) so `authorDisplayName` is always populated even if the caller didn't pass it. `participation.service.ts` uses the same helper — no duplicate implementation.
- [ ] 2.3 ~~Add unit tests for the service under `src/entities/comment/api/comment.service.test.ts` (Firestore emulator).~~ Deferred — rolled into `harden-firestore-writes` alongside the emulator infrastructure work.

## 3. UI — `concert-comments` widget

- [x] 3.1 Create `src/widgets/concert-comments/concert-comments.ui.tsx` — a collapsible accordion:
  - Header: chevron icon + "Kommentare · {count}" (count from `participations`-like live subscription).
  - Body when expanded: scrollable list + text input bar at the bottom.
- [x] 3.2 Render each comment as a bubble. Own comments (`authorId === user.uid`) are right-aligned with the accent color; others are left-aligned with their author color.
- [x] 3.3 Show the author display name above the bubble (small uppercase label, color-matched).
- [x] 3.4 Show "(bearbeitet)" suffix next to the timestamp iff `updatedAt` is present.
- [x] 3.5 On long-press / triple-dot menu of an own comment, reveal an "Bearbeiten" action that swaps the bubble into an inline `<textarea>` with save / cancel buttons; calls `commentService.edit` on save.
- [x] 3.6 Text input: `<textarea>` with auto-grow up to 5 lines, max 2000 chars (hard cap matches the rule); submit button disabled while text is empty or in-flight.
- [x] 3.7 After successful submit, scroll the list to the bottom and clear the input.
- [x] 3.8 Empty-state inside the expanded body: "Noch keine Kommentare.".
- [x] 3.9 Loading state: skeleton list of two bubbles while the first snapshot arrives.
- [x] 3.10 Posting-access gate: when the signed-in user is neither the concert's creator nor a participant, hide the input bar and render a short hint ("Nur Teilnehmende können kommentieren."). Reads stay open.

## 4. Per-user color helper

- [x] 4.1 Create `src/shared/ui/user-color/user-color.ts` exporting `colorForUserId(uid: string): string` — deterministic hash into a 10-entry palette (see design.md Decision 3).
- [x] 4.2 Export an `index.ts` for the helper and add it to `src/shared/ui/index.ts`.
- [x] 4.3 Unit test that the same uid always returns the same color, that different uids spread across the palette, and that the function tolerates empty / undefined input by returning a neutral fallback.

## 5. Mount into concert details

- [x] 5.1 In `src/widgets/concert-details/concert-details.ui.tsx`, render the new `<ConcertComments concert={concert} />` below the existing tab content, full width, with a small visual separator above.
- [x] 5.2 Verify that the comments section coexists with the share sheet (no z-index regressions) and with the modal background. (Manually verified on staging.)

## 6. Notification preference

- [x] 6.1 Extend `NotificationPrefs` in `src/entities/user/model/types.ts` with `newComment?: boolean`.
- [x] 6.2 Add a third `ToggleRow` to `src/features/notification-settings/notification-settings.ui.tsx` titled "Neue Kommentare", subtitle "Du wirst informiert, wenn jemand auf einem deiner Konzerte kommentiert". Wire it to `userService.updateNotificationPrefs` mirroring the existing two toggles.
- [x] 6.3 Default unset → render the toggle as off.

## 7. Cloud Function trigger

- [x] 7.1 Add `functions/src/triggers/on-comment-create.ts` using `onDocumentCreated('concerts/{concertId}/comments/{commentId}', ...)`:
  - Read the comment.
  - Read the parent concert for `band` and `createdBy`.
  - Query `participations` where `concertId == concertId` for participant uids.
  - Build the recipient set: `union(createdBy, participantUids) - authorId`.
  - Filter by `notificationPrefs.newComment == true` (skip users whose user doc is missing the field).
  - Send via the existing `sendToUsers` helper with title `"Neuer Kommentar"` and body `"${authorDisplayName} (${band}): ${text excerpt}"` — excerpt = first 80 chars + `…` if longer.
  - `data: { concertId }` so the existing notification-click handler routes correctly.
- [x] 7.2 Wire the trigger into `functions/src/index.ts`.
- [x] 7.3 Update `functions/src/lib/send-to-users.ts` (if needed) — already accepts a uid array; no change expected.
- [x] 7.4 Build (`cd functions && npm run build`) and deploy (`firebase deploy --only functions`) to staging.

## 8. End-to-end verification

- [x] 8.1 Two test users on two devices; both join a concert.
- [x] 8.2 User A posts a comment → user B sees it appear live in their open detail view; B receives a push if B opted in.
- [x] 8.3 User A edits the comment → "(bearbeitet)" label appears on both clients, text updates live.
- [x] 8.4 User B tries to edit user A's comment → action is not shown / blocked at the rule level. (Rule-level automation now tracked in `harden-firestore-writes` alongside the emulator setup.)
- [x] 8.5 With `newComment` off for user B, A posts a new comment → B does NOT receive a push, but the comment still shows live in the open view.
- [x] 8.6 A non-participant (user C) tries to post a comment → the rule rejects the write and the input bar is hidden client-side. Only creators and current participants can post; therefore Scenario 8.6 as originally written (non-participant comment fans out) is no longer applicable since the posting-access gate landed in task 3.10.

## 9. Docs

- [x] 9.1 Add a "Comments" subsection to `CLAUDE.md` summarising the subcollection layout, the new notification category, and the Cloud Function.
- [x] 9.2 Update the "Push notifications" docs note about the third category and the default-off behaviour.
