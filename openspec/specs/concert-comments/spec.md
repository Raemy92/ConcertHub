# concert-comments Specification

## Purpose

Per-concert text comment threads for last-mile coordination that used to happen on WhatsApp ("Treffpunkt 18:30?", "Wer bringt Bier?"). Chat-style layout with own-right / others-left bubbles, deterministic per-user color coding, author-only inline edit, no delete. Reads are open to every signed-in user; posting is gated to the concert's creator and current participants. Opt-in push notifications on new comments (default off), fan-out to creator + participants minus the author. Storage: `concerts/{concertId}/comments/{commentId}` subcollection with server-owned timestamps enforced in the security rules.

## Requirements

### Requirement: Comment thread is collapsed by default on the concert detail view

The concert detail view SHALL render a dedicated **Kommentare** section beneath the existing tab area. The section SHALL be **collapsed by default** every time the detail view mounts and SHALL show the current comment count next to the section title even while collapsed, so the user can see whether anyone has posted without expanding.

#### Scenario: Detail view opens with the section collapsed

- **WHEN** an authenticated user opens any concert's detail view
- **THEN** the **Kommentare** section is rendered below the tab area
- **AND** the section is collapsed, no comment bodies are visible
- **AND** the section header shows the live comment count (e.g., "Kommentare · 7")

#### Scenario: Expanding the section reveals the thread

- **WHEN** the user taps the section header
- **THEN** the section expands and shows the chronological comment list (oldest first) plus the text input bar at the bottom

#### Scenario: Empty thread shows a friendly placeholder

- **WHEN** the user expands the section and there are zero comments
- **THEN** the body shows the message "Noch keine Kommentare." above the text input

### Requirement: Comments are stored in a per-concert Firestore subcollection

Comments SHALL be stored at `concerts/{concertId}/comments/{commentId}` with the fields `text` (string, 1–2000 chars), `authorId` (string, equal to the writer's Firebase Auth uid), `authorDisplayName` (string, resolved at write time from the `users/{authorId}` document, with the caller-supplied name as fallback), `createdAt` (Firestore server timestamp), and an optional `updatedAt` (Firestore server timestamp, set only when the comment is edited). Both timestamps SHALL be written via `serverTimestamp()` and enforced by the security rules to equal `request.time`, so clients cannot spoof ordering. On read, the service SHALL convert both to ms epoch numbers for the UI.

#### Scenario: Posting a comment writes the expected document

- **WHEN** an eligible author (the concert's creator or a current participant) posts a non-empty comment "Treffpunkt 18:30" on concert `abc123`
- **THEN** a new document is created at `concerts/abc123/comments/{auto-id}` with `text = "Treffpunkt 18:30"`, `authorId = request.auth.uid`, `authorDisplayName` populated from the user's display name, `createdAt` set to the current time
- **AND** `updatedAt` is NOT present on the document

#### Scenario: Display name is denormalized at write time

- **WHEN** the comment is written
- **THEN** the stored `authorDisplayName` matches the user's display name at that moment
- **AND** later changing the user's display name does NOT retroactively update older comments

### Requirement: Author identity and color coding

Every rendered comment SHALL show the author's display name and a stable per-user color. The color SHALL be derived deterministically from the `authorId` so that the same author appears in the same color for every viewer and on every device, without storing the color anywhere.

#### Scenario: Same author always renders in the same color

- **WHEN** the same author posts multiple comments on the same or different concerts
- **THEN** every one of their comments renders with the same color label and name styling
- **AND** the color is the same when viewed by any other authenticated user

#### Scenario: Display name is always visible alongside the color

- **WHEN** any comment is rendered
- **THEN** the author's display name is visible directly above or next to the bubble
- **AND** the user does NOT have to rely on color alone to identify the author

### Requirement: Own comments render right-aligned, others left-aligned

The thread SHALL render comments in a chat-app style layout: the viewing user's own comments are right-aligned, all other authors' comments are left-aligned.

#### Scenario: Viewer sees own comments on the right

- **WHEN** the authenticated viewer has uid `U1` and reads the thread
- **THEN** every comment with `authorId == U1` is right-aligned
- **AND** every comment with `authorId != U1` is left-aligned

#### Scenario: The same comment swaps sides per viewer

- **WHEN** users `U1` and `U2` open the same concert thread
- **AND** `U1` has posted one comment, `U2` has posted one comment
- **THEN** `U1` sees their own comment on the right and `U2`'s on the left
- **AND** `U2` sees their own comment on the right and `U1`'s on the left

### Requirement: Authors can edit their own comments only

An authenticated user SHALL be able to edit the text of any comment whose `authorId` equals their uid, with no time limit. Other users' comments SHALL NOT be editable, and edited comments SHALL be visually marked as having been edited.

#### Scenario: Author edits their own comment

- **WHEN** the author taps the edit action on one of their own comments
- **AND** changes the text and saves
- **THEN** the `text` field is updated in Firestore
- **AND** `updatedAt` is set to the current time
- **AND** the rendered comment shows an "(bearbeitet)" label next to the timestamp

#### Scenario: Non-author cannot edit

- **WHEN** the viewer is not the comment's author
- **THEN** the edit action is not exposed in the UI
- **AND** any direct write attempt (e.g., from another client) is rejected by the Firestore security rules

#### Scenario: Edit preserves immutable fields

- **WHEN** the author edits a comment
- **THEN** `authorId` and `createdAt` are unchanged
- **AND** the security rule rejects any update that attempts to change either of these fields

### Requirement: Comments cannot be deleted

The application SHALL NOT expose a delete action on comments, and the Firestore security rules SHALL deny delete operations on `concerts/{concertId}/comments/{commentId}` for all client callers.

#### Scenario: UI has no delete affordance

- **WHEN** any user views a comment they authored
- **THEN** the available actions are limited to "Bearbeiten" — no delete is shown

#### Scenario: Rule rejects delete attempts

- **WHEN** any client attempts a `deleteDoc` on a comment document
- **THEN** the request is rejected by the security rule

### Requirement: Comments load live and append in order

The comment list SHALL be backed by a real-time `onSnapshot` subscription scoped to the concert, ordered by `createdAt` ascending, so that new comments and edits appear without manual refresh.

#### Scenario: New comment appears live for other viewers

- **WHEN** two users have the same concert detail view open with the comments section expanded
- **AND** one of them posts a new comment
- **THEN** the other user's view appends the new comment at the bottom of the list within the snapshot latency

#### Scenario: Edit propagates live

- **WHEN** a comment is edited
- **THEN** every open viewer's rendering of that comment updates to the new text
- **AND** the "(bearbeitet)" label appears

### Requirement: New-comment notification category opt-in

Users SHALL be able to opt in to push notifications about new comments via a new toggle in the notification settings screen. The preference SHALL be stored as `users/{uid}.notificationPrefs.newComment: boolean` and SHALL **default to false** (a missing field is treated as false).

#### Scenario: Settings screen exposes the new toggle

- **WHEN** an authenticated user opens `/settings`
- **THEN** the notification settings show a third toggle "Neue Kommentare" alongside the existing "Neue Konzerte" and "Neue Teilnehmende"
- **AND** when the user has never opted in, the toggle is rendered as off

#### Scenario: Toggling on persists the preference

- **WHEN** the user toggles "Neue Kommentare" on
- **THEN** `users/{uid}.notificationPrefs.newComment` is set to `true` (merge-write)
- **AND** other preferences are untouched

#### Scenario: Missing field is treated as off

- **WHEN** a user document has no `notificationPrefs.newComment` field
- **THEN** the user is treated as opted out for the purpose of fan-out
- **AND** no push is sent to that user for new comments

### Requirement: Fan-out on new comment respects opt-in and excludes the author

When a new comment document is created under `concerts/{concertId}/comments/{commentId}`, the system SHALL trigger a server-side fan-out that sends a push notification to (a) the concert's creator and (b) every participant of the concert, deduped, **minus** the comment's author, **filtered by** `notificationPrefs.newComment == true`. The notification SHALL identify the author, the concert (band name), and a short excerpt of the comment.

#### Scenario: Author does not receive their own notification

- **WHEN** a user posts a new comment
- **THEN** that user's tokens are not in the recipient set even if their `notificationPrefs.newComment` is true

#### Scenario: Recipient set is creator + participants

- **WHEN** user `C` is the concert's creator and users `P1`, `P2` are participants (and `C` is not necessarily a participant)
- **AND** user `A` (a participant) posts a new comment
- **THEN** the recipient set before filtering is `{C, P1, P2} \ {A}`
- **AND** the function reads `notificationPrefs.newComment` for each remaining user and skips those whose preference is not `true`

#### Scenario: Notification payload routes to the concert detail

- **WHEN** the push is sent
- **THEN** the payload's `data.concertId` is the parent `concertId`
- **AND** the title is "Neuer Kommentar"
- **AND** the body contains the author's display name, the band name, and an excerpt of the comment (first 80 characters, with `…` appended if truncated)
- **AND** tapping the notification opens `/concert/{concertId}` (handled by the existing notification-click handler)

### Requirement: Only concert participants and the creator may post comments

The application and the Firestore security rules SHALL restrict the ability to **create** comments to users who are either the concert's creator (`concerts/{concertId}.createdBy == request.auth.uid`) or a current participant (a document exists at `participations/{concertId}_{request.auth.uid}`). Any other signed-in user SHALL be able to read the thread but SHALL NOT be able to post. **Editing** an existing comment SHALL remain restricted to the original author (per the prior requirement) and SHALL NOT be re-gated on current participation — an author whose participation is later removed SHALL still be able to edit comments they previously posted.

#### Scenario: Participant can post

- **WHEN** a signed-in user has a participation document for the concert
- **THEN** the input bar is rendered in the comments section
- **AND** the user can submit a comment, which is accepted by the security rule

#### Scenario: Concert creator can post even without participating

- **WHEN** a signed-in user is the concert's `createdBy` and does not have a participation document for that concert
- **THEN** the input bar is still rendered
- **AND** the security rule accepts the user's create write

#### Scenario: Non-participant non-creator cannot post

- **WHEN** a signed-in user is neither the concert's creator nor a participant
- **THEN** the input bar is NOT rendered; instead a short hint explains that only participants can comment
- **AND** any direct write attempt (e.g., from another client) is rejected by the Firestore security rule

#### Scenario: Author who has since left can still edit their own past comments

- **WHEN** a user who previously authored comments on a concert has since left the concert (their participation document was deleted)
- **THEN** the rule for update still accepts their edits on those own past comments
- **AND** the rule for create still rejects any new comment they try to post

### Requirement: Text length and content rules

The application and the Firestore security rules SHALL enforce a comment text length of 1–2000 characters. Whitespace-only text SHALL NOT be accepted.

#### Scenario: Empty submit is blocked

- **WHEN** the user has typed nothing (or only whitespace) and taps send
- **THEN** the send action is disabled or the write is rejected, and no document is created

#### Scenario: Over-long submit is blocked

- **WHEN** the user attempts to submit a comment longer than 2000 characters
- **THEN** the client surfaces a length error and does not attempt the write
- **AND** any bypassing client write is rejected by the security rule
