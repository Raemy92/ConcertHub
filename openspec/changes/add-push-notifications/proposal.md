## Why

Concert activity in ConcertHub is invisible unless a user actively opens the app: a new gig can be posted, or a friend can join a concert the user is attending, without anyone being alerted. For a PWA that people install on their phones, that is a missed engagement signal. Push notifications close that loop so users can react in time (buy a ticket, coordinate a carpool, or simply know who else is going) without having to poll the app.

## What Changes

- Introduce Web Push (Firebase Cloud Messaging) so the installed PWA can receive push notifications in the background.
- Send a notification to all opted-in users (except the author) when a **new concert is created**.
- Send a notification to the concert's **creator** and to all existing **participants** (except the actor) when **someone joins a concert**.
- Add a **notification preferences** screen where each user can independently toggle:
  - "Neue Konzerte" (new-concert alerts)
  - "Neue Teilnehmende" (participation-join alerts)
  - the master on/off (device permission + FCM token lifecycle)
- Store per-user preferences and per-device FCM tokens in Firestore so delivery can be filtered server-side.
- Add a **Firebase Cloud Functions** deployment (new to this repo) for the server-side triggers that fan out FCM messages when `concerts` or `participations` documents are written.
- Integrate the FCM service worker with the existing Workbox PWA service worker (the app currently uses `vite-plugin-pwa` in generateSW mode; this will switch to `injectManifest` so both Workbox caching and `firebase/messaging/sw` background handling live in one SW).
- **BREAKING (infra only, no user-visible break):** The service-worker build strategy changes from `generateSW` to `injectManifest`, which requires a hand-authored SW entry file. No changes to cached routes or offline behaviour.

## Capabilities

### New Capabilities

- `push-notifications`: end-to-end push notification system — permission flow, FCM token registration, per-user preferences, server-side fan-out triggers for concert-created and participation-joined events, and in-app settings UI.

### Modified Capabilities

_None — no existing spec's requirements change._

## Impact

- **New dependencies:** `firebase/messaging` (already part of `firebase` SDK, no new npm package); `firebase-admin` and `firebase-functions` in a new `functions/` workspace for Cloud Functions; `firebase-tools` as a dev dependency for local emulation/deploy.
- **New Firebase services to enable:** Cloud Messaging (free on Spark — only requires generating a Web Push / VAPID key pair in the project settings), and Cloud Functions for the server-side fan-out. **Cloud Functions deployment requires the Blaze pay-as-you-go plan** (FCM itself is free; the Blaze requirement is for Cloud Functions, not for FCM). Expected runtime cost at ConcertHub's scale stays within Blaze's always-free tier.
- **New env vars:** `VITE_FIREBASE_VAPID_KEY` in `environments/.env.local`.
- **Firestore schema changes:**
  - `users/{uid}` gains `notificationPrefs: { newConcert: boolean; newParticipant: boolean }`.
  - New subcollection `users/{uid}/fcmTokens/{tokenId}` with `{ token, userAgent, createdAt, lastSeenAt }` (one doc per device/browser).
- **Firestore security rules:** need to be updated/created to restrict `fcmTokens` writes to the owning user and to allow Cloud Functions (admin) reads.
- **Build/deploy pipeline:** `vite-plugin-pwa` config switches from `generateSW` to `injectManifest`; a new `src/sw.ts` (or similar) is added. `firebase.json` gains a `functions` block.
- **Code touched:**
  - `src/shared/api/firebase/config.ts` (export `messaging`)
  - new `src/shared/notifications/` module (token registration, permission flow, foreground message handler)
  - new `src/features/notification-settings/` feature (preferences UI)
  - `src/entities/participation/api/participation.service.ts` and `src/entities/concert/api/concert.service.ts` stay unchanged — fan-out is driven by Firestore triggers, not client writes.
  - new `functions/` directory (TypeScript Cloud Functions).
