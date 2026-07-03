# push-notifications Specification

## Purpose

Opt-in Web Push notifications for ConcertHub so users get pinged when new concerts are created and when other users join a concert they created or already joined. Delivery uses Firebase Cloud Messaging (FCM) with a VAPID key on the client and Firestore-triggered Cloud Functions (`onConcertCreate`, `onParticipationCreate`) on the server. Preferences live on `users/{uid}.notificationPrefs` with independent `newConcert` and `newParticipant` category toggles; per-device registration tokens live under `users/{uid}/fcmTokens/{tokenId}`. The service worker routes notification taps to `/concert/{concertId}`, and the Cloud Functions prune permanently-invalid tokens on send.

## Requirements

### Requirement: Users opt in to push notifications from a settings screen

The application SHALL expose a dedicated notification-settings screen where the signed-in user can enable or disable push notifications and independently toggle each notification category. Enabling notifications SHALL request the browser's `Notification.requestPermission()` and, only on `granted`, register an FCM token for the current device. Disabling notifications SHALL delete the token from the server and stop further delivery to that device.

#### Scenario: User enables notifications for the first time

- **WHEN** the user opens the notification settings screen and toggles the master switch on
- **AND** the browser permission prompt is shown and the user selects "Allow"
- **THEN** the client obtains an FCM registration token using the configured VAPID key
- **AND** the token is written to Firestore at `users/{uid}/fcmTokens/{tokenId}` with `{ token, userAgent, createdAt, lastSeenAt }`
- **AND** a `notificationPrefs` object is written to `users/{uid}` with `{ newConcert: true, newParticipant: true }` if it does not already exist
- **AND** the settings screen shows the master switch as enabled and both category toggles as on

#### Scenario: User denies the browser permission prompt

- **WHEN** the user toggles the master switch on and the browser permission prompt resolves to `denied` or `default`
- **THEN** no token is registered and no `notificationPrefs` is written
- **AND** the master switch returns to its off state
- **AND** the screen surfaces a hint explaining that the user must grant permission in the browser to enable notifications

#### Scenario: User disables notifications on a device

- **WHEN** the user toggles the master switch off on a device where notifications are currently enabled
- **THEN** the client calls FCM `deleteToken` for the current registration token
- **AND** the corresponding `users/{uid}/fcmTokens/{tokenId}` document is deleted
- **AND** the category toggles on that screen are hidden or disabled
- **AND** subsequent pushes are not delivered to that device

#### Scenario: Category toggles respect individual preferences

- **WHEN** the user turns off the "Neue Konzerte" toggle but leaves "Neue Teilnehmende" on
- **THEN** `users/{uid}.notificationPrefs.newConcert` is written as `false` and `newParticipant` remains `true`
- **AND** concert-created notifications are no longer delivered to any of that user's tokens
- **AND** participation-joined notifications continue to be delivered

#### Scenario: Browser does not support Web Push

- **WHEN** the settings screen loads in a browser where `'Notification' in window` is false or the service worker registration fails
- **THEN** the master switch is rendered as disabled
- **AND** an explanatory message is shown (e.g., asking the user to install the PWA on iOS)
- **AND** no permission prompt is triggered

### Requirement: Notifications fan out when a new concert is created

When a `concerts` document is newly written (create, not update), the system SHALL send a push notification to every user who has `notificationPrefs.newConcert == true`, excluding the concert's creator. The notification SHALL identify the concert so the recipient can recognise it at a glance.

#### Scenario: New concert triggers fan-out to opted-in users

- **WHEN** a user creates a new concert (a new document is added to the `concerts` collection)
- **THEN** the `onConcertCreate` Cloud Function runs
- **AND** it queries all users where `notificationPrefs.newConcert == true`
- **AND** for each such user (excluding `concerts.{id}.createdBy`), it reads their `users/{uid}/fcmTokens` subcollection
- **AND** it sends a multicast FCM message to those tokens with a title like "Neues Konzert" and a body containing at least the band name and date
- **AND** the payload's `data.concertId` field equals the new concert's document id so the client can route to `/concert/{id}` when tapped

#### Scenario: Creator does not receive their own notification

- **WHEN** the user creating the concert has `notificationPrefs.newConcert == true` and has one or more FCM tokens
- **THEN** the Cloud Function SHALL NOT include that user's tokens in the send list
- **AND** the creator receives no push for the concert they just created

#### Scenario: Users who opted out receive nothing

- **WHEN** a user has `notificationPrefs.newConcert == false` (or the field is missing, or the user has no `notificationPrefs` at all)
- **THEN** none of that user's tokens are included in the send list
- **AND** the user receives no push for any new concert

### Requirement: Notifications fan out when a new participant joins

When a `participations` document is newly written (create, not update), the system SHALL send a push notification to the concert's creator and to every other participant of the same concert, excluding the joining user. The notification SHALL identify who joined and which concert.

#### Scenario: Participant join notifies the concert creator

- **WHEN** a user joins a concert (a new document is added to `participations` with `userId` = the joiner)
- **THEN** the `onParticipationCreate` Cloud Function reads `concerts/{concertId}.createdBy` and includes that user in the recipient set, unless `createdBy` equals the joiner's `userId`
- **AND** the creator receives a push whose body contains the joiner's `displayName` and the concert's band name, if `notificationPrefs.newParticipant == true` for the creator

#### Scenario: Participant join notifies co-participants

- **WHEN** a user joins a concert that already has other participants
- **THEN** the Cloud Function queries `participations where concertId == X` and collects every `userId` that is not the joining user
- **AND** it unions that set with the concert's creator (deduplicated)
- **AND** it delivers a push to every user in the set whose `notificationPrefs.newParticipant == true`

#### Scenario: Joiner does not receive their own notification

- **WHEN** a user joins a concert
- **THEN** the Cloud Function SHALL exclude that user's `userId` from the recipient set regardless of that user's preferences
- **AND** the joining user receives no push for the action they just performed

#### Scenario: Opted-out recipients are skipped

- **WHEN** a user in the recipient set has `notificationPrefs.newParticipant == false` (or the field / the whole `notificationPrefs` object is missing)
- **THEN** that user's tokens are excluded from the send list
- **AND** the user receives no participation-joined push

### Requirement: Tapping a notification opens the related concert

Every notification payload SHALL include a `data.concertId` field, and the service worker SHALL handle the `notificationclick` event by focusing an existing app window (or opening a new one) at `/concert/{concertId}` so the user lands directly on the concert detail view.

#### Scenario: Tapping a notification opens the concert detail route

- **WHEN** the user taps a push notification delivered by the app
- **THEN** the service worker's `notificationclick` handler runs
- **AND** it navigates (or focuses) an app window at the URL `/concert/{data.concertId}`
- **AND** the notification is closed

#### Scenario: Tapping a notification with no concert id falls back to the home route

- **WHEN** a notification is delivered with a missing or empty `data.concertId` (e.g., from an older payload format)
- **THEN** the click handler opens or focuses the app at `/`
- **AND** no error is thrown

### Requirement: Invalid FCM tokens are pruned server-side

When the Cloud Function receives a per-token error from FCM indicating a permanently invalid token (e.g., `messaging/registration-token-not-registered`), it SHALL delete the corresponding `users/{uid}/fcmTokens/{tokenId}` document so that future fan-outs do not attempt that token again.

#### Scenario: Stale token is removed after a failed send

- **WHEN** a multicast send returns a per-token failure with error code `messaging/registration-token-not-registered` (or the deprecated `messaging/invalid-registration-token`)
- **THEN** the Cloud Function deletes the matching `users/{uid}/fcmTokens/{tokenId}` document
- **AND** subsequent fan-outs do not include that token

#### Scenario: Transient send errors do not delete tokens

- **WHEN** a per-token failure has an error code indicating a transient issue (e.g., `messaging/internal-error`, `messaging/server-unavailable`)
- **THEN** the token document is NOT deleted
- **AND** the failure is logged for observability

### Requirement: FCM token documents are writable only by their owner

Firestore security rules SHALL restrict read and write access to `users/{uid}/fcmTokens/{tokenId}` so that only the authenticated user whose uid matches the parent document may create, update, or delete token docs. The `notificationPrefs` field on `users/{uid}` SHALL likewise be writable only by the owning user.

#### Scenario: User writes their own token

- **WHEN** an authenticated user with `auth.uid == X` creates a document at `users/X/fcmTokens/...`
- **THEN** the write succeeds

#### Scenario: User cannot write another user's token

- **WHEN** an authenticated user with `auth.uid == X` attempts to write `users/Y/fcmTokens/...` where `Y != X`
- **THEN** the write is rejected by Firestore security rules
