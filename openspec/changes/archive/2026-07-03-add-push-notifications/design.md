## Context

ConcertHub is a React 19 + Firebase PWA installed on users' phones and desktops. Today it has no server-side components beyond Firestore: auth, concert CRUD and participation writes are all driven from the client. The existing PWA is produced by `vite-plugin-pwa` in **generateSW** mode — Workbox auto-generates the service worker. Firestore currently holds three top-level collections (`users`, `concerts`, `participations`); there are no security rules committed to the repo yet.

Web Push on iOS only works when the PWA is installed to the home screen (iOS 16.4+), and Android/desktop Chrome work from the PWA install as well as the browser tab. Delivering a push requires three pieces: (1) a **service worker** that receives the push event, (2) an **FCM token** registered with a VAPID key per browser/device, (3) a **trusted backend** that calls FCM's Send API with the FCM Admin SDK. The browser SDK alone cannot send pushes from one client to another.

## Goals / Non-Goals

**Goals:**

- Deliver background push notifications to installed PWAs on iOS 16.4+, Android, and desktop Chrome/Edge/Firefox.
- Two triggers: concert-created fan-out, participation-joined fan-out.
- Per-user, per-category preferences stored in Firestore and respected server-side.
- Never notify the actor (no self-notifications).
- Graceful no-op on browsers that don't support Web Push.
- Keep the existing offline caching behaviour of the Workbox-based PWA.

**Non-Goals:**

- In-app (foreground) notification toasts with rich UI — we will surface a minimal native browser notification for foreground messages, not a custom toast system.
- Notification history / inbox inside the app.
- Email or SMS fallbacks.
- Per-concert mute / watch toggles (only the two global category toggles land in this change).
- Scheduled reminders (e.g., "concert is tomorrow") — out of scope; can be a follow-up change.
- iOS Safari tab-only push (not supported by the platform).

## Decisions

### Decision 1: Use Firebase Cloud Messaging (FCM) over raw Web Push

**Choice:** FCM via the `firebase/messaging` client SDK and `firebase-admin` on the server side.

**Why:** The project is already all-in on Firebase (auth, Firestore, hosting). FCM handles VAPID key management, retries, and the Apple Push / FCM fan-out transparently. Using raw Web Push would require us to maintain a subscription store and implement push encryption manually.

**Alternative considered:** A custom backend (e.g., Cloudflare Worker) sending Web Push directly via `web-push`. Rejected because it adds a second deployment target for no functional gain.

### Decision 2: Fan-out happens in Firebase Cloud Functions, not on the client

**Choice:** Two Firestore-triggered Cloud Functions:

- `onConcertCreate` — fires on `concerts/{id}` document create. Reads all users with `notificationPrefs.newConcert == true`, excludes `createdBy`, sends a multicast FCM message to their tokens.
- `onParticipationCreate` — fires on `participations/{id}` document create. Reads the concert doc to find `createdBy`; queries `participations` where `concertId == X` to find all co-participants; unions into a recipient set; excludes the joining `userId`; filters by `notificationPrefs.newParticipant == true`; sends.

**Why:** Sending pushes requires admin credentials (the FCM server key). Keeping that on the client is impossible. Firestore triggers are the natural fit because the app already writes to Firestore — no API layer to re-introduce.

**Alternative considered:** Callable Functions invoked from the client after each write. Rejected because it would couple client success to server success (the write would appear to succeed while the notify call could fail silently) and because triggers handle retries for free.

**Trade-off:** FCM itself is free on Spark — the Blaze (pay-as-you-go) plan requirement is for **Cloud Functions deployment**, not for sending pushes. At ConcertHub's scale (~tens of users, single-digit concerts/week) the usage fits inside Blaze's always-free tier for Functions (2M invocations/month), so the effective cost is ~0 €, but billing must still be enabled on the project. Setting a low budget alert (e.g., 1 USD/month) is recommended as a safety net.

### Decision 3: Switch vite-plugin-pwa from `generateSW` to `injectManifest`

**Choice:** Hand-author `src/sw.ts`; let Workbox's `injectManifest` build pipeline inject the precache manifest into our file. Inside that SW, import `firebase/messaging/sw` and call `onBackgroundMessage` alongside Workbox routing.

**Why:** Firebase's reference path is a separate `firebase-messaging-sw.js` at the site root. That conflicts with the Workbox SW because two service workers cannot share the same scope (`/`). We want both Workbox offline caching **and** FCM background messaging, which means one SW file that does both. `injectManifest` is the documented vite-plugin-pwa strategy for custom SW code.

**Alternative considered:** Scope the Firebase SW to a subpath (e.g., `/fcm/`). Rejected because `onBackgroundMessage` needs to run in the top-level scope to handle the push event for the app's origin.

### Decision 4: FCM tokens live in a subcollection, one doc per device

**Choice:** `users/{uid}/fcmTokens/{tokenId}` where `tokenId` is the FCM token's SHA-256 (or a UUID generated client-side and stored in `localStorage` so the same browser reuses the same doc). Each doc stores `{ token, userAgent, createdAt, lastSeenAt }`.

**Why:** A user can install the PWA on multiple devices (phone + desktop). A single `tokens: string[]` field on the user doc is racy to update and makes cleanup (invalid-token pruning) awkward. A subcollection lets Cloud Functions batch-delete stale tokens returned by FCM's `BatchResponse`.

**Alternative considered:** Map on the user doc keyed by device id. Rejected because it inflates the user doc size and complicates security rules (the client can only write its own tokens).

### Decision 5: Preferences default to ON after the user explicitly grants permission

**Choice:** New users have no `notificationPrefs` field. The first time the user visits the settings screen and toggles the master on, we request browser permission, register a token, and write `notificationPrefs: { newConcert: true, newParticipant: true }`. Cloud Functions treat a missing `notificationPrefs` field or missing fcmTokens subcollection as "opted out".

**Why:** Silent opt-in would be spammy and erodes trust. Making the first toggle both the permission prompt and the write keeps the UX honest: if the browser permission is denied, nothing changes server-side.

### Decision 6: Never notify the actor

**Choice:** Both triggers read the actor's uid from the document (`createdBy` on concert, `userId` on participation) and exclude it from the recipient set before sending.

**Why:** Stated in the requirements — the user's own actions should not ping them back.

### Decision 7: Firestore security rules are authored as part of this change

**Context:** The repo has no `firestore.rules` file today. Adding `users/{uid}/fcmTokens/{tokenId}` without rules would require rules anyway, so we write the full ruleset for `users`, `concerts`, `participations`, and `fcmTokens` in the same change. Cloud Functions bypass rules via the admin SDK, so rules only need to cover client access.

## Risks / Trade-offs

- **[Blaze plan required for Cloud Functions — not for FCM]** → Cloud Messaging itself works on Spark; the Blaze upgrade is only needed to deploy the Cloud Functions that trigger the fan-out. Mitigation: documented in `tasks.md`, combined with a budget alert so the user is safeguarded against unexpected charges. Usage is expected to stay inside Blaze's free tier.
- **[iOS Safari tabs don't receive push]** → Expected. The settings screen will detect `!('Notification' in window)` and show a hint that the user must install the PWA to the home screen.
- **[Service worker migration risk]** → Switching from `generateSW` to `injectManifest` can subtly change caching behaviour. Mitigation: the new `src/sw.ts` explicitly registers the existing Workbox routes (Google Fonts, gstatic, firebasejs) so parity is preserved; test offline loading after the switch.
- **[Stale tokens pile up]** → FCM returns `messaging/registration-token-not-registered` for dead tokens. Mitigation: on send, the function deletes the corresponding `fcmTokens` doc whenever that error code is returned.
- **[Notification fatigue at scale]** → Each new concert pings every opted-in user. At current user counts (<100) this is fine; at larger scale per-concert / per-band muting would be needed. Mitigation: documented as a follow-up non-goal; the two-toggle model makes opt-out trivial.
- **[Privacy: notification text leaks on lock screen]** → Payload intentionally contains only the band name and the actor's display name — both already public within the app. No emails, no ticket status. Acceptable.
- **[Bundle size of firebase/messaging]** → ~40 KB gzipped. Mitigation: lazy-imported only when the settings screen or registration flow runs, not in the main chunk.

## Migration Plan

1. **Firebase Console (manual):** upgrade project to Blaze; enable Cloud Messaging; generate a Web Push certificate (VAPID key pair).
2. **Environments:** add `VITE_FIREBASE_VAPID_KEY` to `environments/.env.example` and `.env.local`.
3. **Firestore rules:** author `firestore.rules` covering existing collections + the new `fcmTokens` subcollection; deploy via `firebase deploy --only firestore:rules`.
4. **Service worker swap:** change `vite.config.ts` to `strategies: 'injectManifest'`, add `src/sw.ts` preserving the existing runtime-caching routes, add FCM `onBackgroundMessage`.
5. **Client module:** add `src/shared/notifications/` with `requestPermissionAndToken`, `deleteToken`, `onForegroundMessage`. Lazy-imported.
6. **Settings UI:** new `src/features/notification-settings/` feature + a route/view entry (e.g., under the existing settings or profile area, or a new `/settings` page).
7. **Functions workspace:** `firebase init functions` (TypeScript); implement `onConcertCreate`, `onParticipationCreate`; deploy with `firebase deploy --only functions`.
8. **Smoke test:** install PWA on two devices (iOS + desktop), enable prefs on both, create a concert from device A, verify device B receives a push; have device B join, verify device A (creator) receives a push.

**Rollback:** all additions are additive. If something goes wrong:

- Disable Functions via Firebase Console (stops all pushes immediately).
- Revert the SW strategy swap in `vite.config.ts` (brings back generateSW; next PWA update clears the custom SW).
- Client continues to work without any notifications (settings screen just shows "disabled").

## Open Questions

- **Where does the settings entry point live in the navigation?** The app has `main-nav` and `mobile-nav-drawer`; a dedicated `/settings` view seems cleanest. To confirm during implementation.
- **Notification language:** the app UI is German ("Neue Konzerte", "Teilnehmende"). Assume German notification bodies; no i18n framework is present today.
- **Token refresh cadence:** FCM tokens can rotate. The simplest answer is "re-register on every app load when permission is granted" and upsert the token doc — accepted unless a cheaper strategy surfaces during implementation.
