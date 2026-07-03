## Why

ConcertHub captures the structured side of a concert plan — who is going, who drives, who has a ticket — but the surrounding conversation ("Treffpunkt 18:30 Café X?", "Wer bringt Bier ins Auto?", "Falle leider doch noch aus, sorry") still happens on WhatsApp. For a 12-person friend group that uses the app to coordinate every gig, splitting the structured data from the actual discussion means the app keeps losing context to chat groups.

A lightweight per-concert comment thread closes that gap. It is explicitly NOT a chat: text-only, chronological, expandable on demand, and edit-only on your own posts. The goal is enough communication for last-mile coordination, no more.

## What Changes

- Add a new Firestore subcollection `concerts/{concertId}/comments/{commentId}` storing `{ text, authorId, authorDisplayName, createdAt, updatedAt? }`.
- Add a `commentsService` under `src/entities/comment/` (FSD layout matching `concert` / `participation`) exposing `subscribeByConcert`, `post`, and `edit`.
- Add a new collapsible **Kommentare** section to the concert detail view (`src/widgets/concert-details/`). The section is **collapsed by default** so it does not lengthen the page when no one is reading the thread, and shows an unread-count-style indicator with the number of comments next to the header.
- Render comments chat-style: **own comments right-aligned**, **others left-aligned**. Each comment shows the author's display name and a **stable per-user color** (deterministic from `authorId` hash, drawn from a fixed palette that contrasts with the dark UI).
- Text-only input at the bottom of the expanded section with a submit button. Multi-line input allowed (Enter newline, button to send).
- An author can **edit their own comments** at any time. Other users' comments are read-only. Edited comments show an "(bearbeitet)" label.
- Delete is NOT supported (out of scope — see Non-Goals in design.md).
- Add a new notification preference `notificationPrefs.newComment` (default **false**, opt-in) to the existing notification settings UI.
- Add a Cloud Function `onCommentCreate` that fans out a push notification to: the concert creator + all participants of that concert, minus the comment author, filtered by `notificationPrefs.newComment == true`. Payload routes to `/concert/{concertId}` on click (same routing as existing push notifications).

## Capabilities

### New Capabilities

- `concert-comments`: per-concert text comment threads with expand-on-demand UI, chat-style layout, per-user color coding, author-only edit, and opt-in push notifications on new comments.

### Modified Capabilities

_None of the existing archived specs change._ The `push-notifications` capability (still in-progress in change `add-push-notifications`) gains a new category; that delta is documented inside this change's `concert-comments` spec so the two changes can land independently in any order — whichever ships last picks up the new category.

## Impact

- **Firestore schema:** new subcollection `concerts/{concertId}/comments/{commentId}`. `users/{uid}.notificationPrefs` gains a `newComment: boolean` field (optional; missing = treated as false).
- **Firestore security rules:** new rules for the `comments` subcollection — authenticated read; authenticated create with `authorId == request.auth.uid` and required fields; update only by the comment's author, restricted to `text` and `updatedAt` fields.
- **Cloud Functions:** new trigger `functions/src/triggers/on-comment-create.ts` reusing the existing `sendToUsers` utility.
- **Client code touched:**
  - new `src/entities/comment/` (types + service)
  - new `src/widgets/concert-comments/` (the collapsible thread)
  - `src/widgets/concert-details/concert-details.ui.tsx` (mount the new section)
  - `src/features/notification-settings/notification-settings.ui.tsx` (add third toggle)
  - `src/entities/user/model/types.ts` (extend `NotificationPrefs`)
  - new `src/shared/ui/user-color/` helper (deterministic color from uid)
- **No new env vars, no new dependencies.**
