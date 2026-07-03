## Context

ConcertHub already stores concert metadata in `concerts` and per-user attendance in `participations`. The detail view (`src/widgets/concert-details/concert-details.ui.tsx`) renders three tabs (Dabei / Tickets / Carpool) plus a hero, info tiles and a share sheet. Push notifications are powered by Firebase Cloud Messaging via the in-progress `add-push-notifications` change (`onConcertCreate`, `onParticipationCreate` triggers and a `notificationPrefs` map on `users/{uid}`).

Adding comments needs to feel native to that detail page and reuse the existing notification infrastructure rather than introducing new patterns.

## Goals / Non-Goals

**Goals:**

- A text-only, expandable thread per concert that any authenticated user can post into.
- Chronological order, oldest at the top, newest at the bottom (natural reading order for a thread).
- Clear author attribution via name + stable color, with a chat-app-like own/other side split.
- Author-only edits, with an obvious "(bearbeitet)" affordance so readers can tell.
- Opt-in push notifications, off by default, integrated into the existing settings UI.

**Non-Goals:**

- Reactions (👍 / ❤️ etc.).
- Threading / replies.
- Mentions / @-tagging.
- Rich text, links auto-detection, image / file attachments.
- Delete (see Decision 4).
- Read-receipts or unread counters per user.
- Moderation tools.
- Pagination — for a 12-person friend group, the comment count per concert will stay small; load the full thread on expand.

## Decisions

### Decision 1: Subcollection, not top-level collection

**Choice:** Store comments at `concerts/{concertId}/comments/{commentId}`, not as a top-level `comments` collection with a `concertId` field.

**Why:** Subcollection scoping makes security rules trivially simple (`request.auth != null` for read, ownership check on write — no need to join with the concert doc). It also avoids any global index when listing comments per concert. The cost (cannot trivially "list all comments in the system") doesn't matter — no feature needs that.

**Alternative considered:** Top-level `comments` with a composite index `(concertId, createdAt)`. Rejected because it adds index cost and rule complexity for no benefit.

### Decision 2: Denormalize `authorDisplayName` into the comment doc

**Choice:** Persist `authorDisplayName` on every comment, snapshotted at write time. Do NOT re-fetch the user doc when rendering.

**Why:** Matches the existing pattern in `participation.service.ts` (`displayName` is denormalized into participation docs). Saves N reads per thread render. If a user later changes their display name, old comments keep the historical name — acceptable for a friend group app where names barely change.

**Trade-off:** If a user does change their display name, old comments look stale. We accept this; no migration needed.

### Decision 3: Deterministic color from uid hash

**Choice:** Pick the author color by hashing `authorId` (simple FNV-1a or `String.prototype.charCodeAt` sum mod palette size) into a fixed palette of 10 colors chosen for AA contrast on the app's dark background.

**Why:** Stateless, stable across sessions and devices, requires no extra Firestore field. The same author always has the same color for every viewer.

**Alternative considered:** Letting users pick their own color in settings. Rejected as over-engineered for a 12-person group; the deterministic approach is "free" and good enough.

**Palette sketch (final values to be tuned in the UI task):**

```
#7CFFB2  #FFB020  #4FC3F7  #F06292
#BA68C8  #FF8A65  #81C784  #FFD54F
#90CAF9  #A1887F
```

### Decision 4: No delete, only edit

**Choice:** Comments can be edited by the author but not deleted by anyone (not even the author).

**Why:** A friend group of 12 doesn't need a moderation system. Edit covers the legitimate use case ("oops, typo"). Delete would invite drama ("who deleted what?") and would also leave dangling references in any future quoting / reply feature. If a comment truly needs to come down, an admin can do it directly in Firestore.

**Trade-off:** A user who posts something embarrassing can edit it to "[gelöscht]" but the entry stays. We accept this trade — explicit, visible, predictable.

### Decision 5: Notify both creator and participants

**Choice:** The push-notification recipient set is `union(concert.createdBy, all participation.userId for that concert) minus comment.authorId`, filtered by `notificationPrefs.newComment == true`.

**Why:** Mirrors the join-notification recipient logic in `onParticipationCreate`. The creator cares about activity on their concert even if they're not personally attending (rare but possible). Non-participants who happen to comment do not get follow-up notifications — by definition they aren't in the recipient set unless they later join.

**Edge:** If the comment author is a participant, they are still excluded (no self-notify).

### Decision 6: Default OFF for the new notification category

**Choice:** `notificationPrefs.newComment` defaults to `false` for both existing and new users; a missing field is treated as `false`.

**Why:** Comments can be high-volume relative to the other two categories. Opt-in respects users who already enabled notifications for concert/join events without surprising them with a new noisy channel. The user has to actively flip the toggle in `/settings`.

### Decision 7: Expand-on-demand, count badge always visible

**Choice:** The comments section is a collapsed accordion. The header always shows the comment count (e.g., "Kommentare · 7") even when collapsed. Expand state is per-mount (not persisted across navigations) to avoid a settings-creep on what's already a small UI.

**Why:** Keeps the detail page short on first open (most users won't read the thread on most opens), while making the existence and size of the thread visible at a glance.

### Decision 8: Only the creator and current participants may post

**Choice:** Posting a comment requires the author to be either the concert's `createdBy` or have a `participations/{concertId}_{uid}` document. The Firestore rule enforces this with a `get(concert).createdBy == uid || exists(participation)` check; the client hides the input bar with a "Nur Teilnehmende können kommentieren" hint when the rule would reject.

**Why:** Comments are a coordination tool for people who are actually going. A signed-in friend who is not attending has no business writing into the thread — it would only add noise. The creator is included so they can react on their own concert even if they themselves haven't joined.

**Trade-off:** Updates are NOT gated on current participation: if an author later leaves the concert, their old comments stay editable. The alternative — locking out edits on departure — would invalidate legitimate fixes (typo a year later) and feels punitive for a tiny friend group. The participation check applies only to _new_ comments.

**Cost:** One extra `get`/`exists` Firestore read per create. Negligible at the project's scale.

**Read access is unchanged** — every signed-in user can still read the thread. The change is write-side only.

## Risks / Trade-offs

- **Security rules complexity:** rules for the subcollection plus the existing top-level rules need to stay coherent. Mitigation: explicit allow rule for `concerts/{cid}/comments/{commentId}`, no implicit fall-through.
- **Cloud Function cost:** every comment costs one function invocation + N FCM sends. For a 12-person group writing maybe dozens of comments per active concert, this stays inside the Blaze always-free tier.
- **`updatedAt` confusion:** since the field is only set on edit, presence-based rendering is straightforward. We avoid setting it on create to keep the "(bearbeitet)" label cheap to compute.
- **Color collisions:** with 10 palette entries and 12 users, ~50% chance of at least one collision (birthday-paradox-ish). Acceptable — the name is always visible alongside the color, so a collision is mildly ugly but not confusing.

## Migration

- No existing data to migrate.
- Existing user documents may not have `notificationPrefs.newComment`; the rendering and the Cloud Function both treat missing as `false`. No backfill required.
