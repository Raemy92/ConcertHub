## 1. Firebase project prerequisites (manual, in the Firebase Console)

- [ ] 1.1 In **Project settings → Cloud Messaging → Web configuration → Web Push certificates**, click **Generate key pair** and copy the public key. FCM itself works on the free Spark plan — this step does not require any plan upgrade.
- [ ] 1.2 In the same **Cloud Messaging** tab, confirm that **Firebase Cloud Messaging API (V1)** shows as **Enabled** at the top. If it is disabled, click through to the Google Cloud Console and enable it.
- [ ] 1.3 Upgrade the Firebase project from **Spark** to the **Blaze** pay-as-you-go plan — required to deploy Cloud Functions, which are needed for the server-side fan-out. FCM sending itself is free; the plan upgrade is for Functions hosting only.
- [ ] 1.4 Immediately after the Blaze upgrade, set a low budget alert in **Usage and billing → Details & settings → Budget alerts** (e.g., 1 USD/month with email notification) so any runaway cost is flagged early. Expected real usage stays inside Blaze's always-free tier.
- [ ] 1.5 Install `firebase-tools` globally (`npm i -g firebase-tools`) and run `firebase login` on the dev machine.
- [ ] 1.6 Run `firebase use --add` inside the repo and select the ConcertHub project so `.firebaserc` is created.

## 2. Environment + dependency setup

- [x] 2.1 Add `VITE_FIREBASE_VAPID_KEY=` placeholder to `environments/.env.example` with an explanatory comment.
- [ ] 2.2 Add the real VAPID public key to `environments/.env.local` under `VITE_FIREBASE_VAPID_KEY`.
- [x] 2.3 Add the key to the Vite env typings in `src/vite-env.d.ts` so `import.meta.env.VITE_FIREBASE_VAPID_KEY` is typed.
- [x] 2.4 Confirm `firebase` (already installed) includes the `firebase/messaging` and `firebase/messaging/sw` subpaths; no extra npm install needed on the client.

## 3. Firestore security rules

- [x] 3.1 Create `firestore.rules` at the repo root with rules covering `users` (owner-only write, authenticated read), `users/{uid}/fcmTokens/{tokenId}` (owner-only read/write), `concerts` (authenticated read, authenticated create, creator-only update/archive), and `participations` (authenticated read, own-doc create/update/delete with id convention `{concertId}_{uid}`).
- [x] 3.2 Add `firestore.rules` and `firestore.indexes.json` references to `firebase.json` under a `firestore` block.
- [ ] 3.3 Deploy rules with `firebase deploy --only firestore:rules` and verify in the console.

## 4. Service worker migration (generateSW → injectManifest)

- [x] 4.1 In `vite.config.ts`, change `VitePWA({ registerType: 'autoUpdate', ... })` to add `strategies: 'injectManifest'` and `srcDir: 'src'`, `filename: 'sw.ts'`, `injectManifest: { globPatterns: [...] }` mirroring the current `workbox.globPatterns`.
- [x] 4.2 Create `src/sw.ts` that: (a) declares the Workbox `self` type, (b) precaches `self.__WB_MANIFEST`, (c) re-registers the existing runtime caching routes for Google Fonts, gstatic, and firebasejs using `workbox-routing` + `workbox-strategies`, (d) sets up `navigateFallback` via `workbox-routing`.
- [x] 4.3 In `src/sw.ts`, import `initializeApp` from `firebase/app` and `getMessaging`, `onBackgroundMessage` from `firebase/messaging/sw`. Initialise Firebase inside the SW with a minimal config (the SW cannot read `import.meta.env` — inline only the fields FCM actually needs: `apiKey`, `projectId`, `messagingSenderId`, `appId` — via Vite's `define` or read at build time).
- [x] 4.4 In `src/sw.ts`, register `onBackgroundMessage` to show a `Notification` using the payload's `notification.title`, `notification.body`, and stash `data.concertId` on the notification so the click handler can read it.
- [x] 4.5 In `src/sw.ts`, add a `self.addEventListener('notificationclick', ...)` handler that calls `event.notification.close()` then `clients.openWindow('/concert/' + (data.concertId ?? ''))` or focuses an existing client.
- [x] 4.6 Run `npm run build` and confirm the generated SW contains both the Workbox precache manifest and the FCM handlers. Smoke-test offline mode in `npm run preview`.

## 5. Client notifications module

- [x] 5.1 Create `src/shared/api/firebase/messaging.ts` that exports a lazy `getMessagingInstance()` returning `getMessaging(app)` only when `isSupported()` resolves true; otherwise returns `null`.
- [x] 5.2 Create `src/shared/notifications/notifications.service.ts` exporting: `isNotificationsSupported()`, `requestPermissionAndRegister(user)`, `unregisterCurrentDevice(user)`, `onForegroundMessage(callback)`.
- [x] 5.3 Implement `requestPermissionAndRegister`: call `Notification.requestPermission()`; on `granted`, call `getToken(messaging, { vapidKey, serviceWorkerRegistration })`; write `users/{uid}/fcmTokens/{tokenId}` with `{ token, userAgent: navigator.userAgent, createdAt: Date.now(), lastSeenAt: Date.now() }`. Use a stable `tokenId` stored in `localStorage` (UUID generated on first use) so the same browser reuses its doc.
- [x] 5.4 Implement `unregisterCurrentDevice`: look up the stored `tokenId`, call `deleteToken(messaging)`, delete the `users/{uid}/fcmTokens/{tokenId}` doc, clear the `localStorage` entry.
- [x] 5.5 Implement `onForegroundMessage`: use FCM's `onMessage` so when the app is focused and a push arrives, we show a minimal `new Notification(...)` (or call the callback for a future toast UI).
- [x] 5.6 Extend `src/shared/api/firebase/config.ts` to register the custom SW (`navigator.serviceWorker.register('/sw.js', { type: 'module' })`) and pass that registration to `getToken` — or rely on vite-plugin-pwa's auto-registration and retrieve it via `navigator.serviceWorker.ready`.

## 6. User preferences data model

- [x] 6.1 Extend the `AppUser` type in `src/app/providers/auth.provider.tsx` (or a new `users` entity module) with an optional `notificationPrefs?: { newConcert: boolean; newParticipant: boolean }` field, read from the `users/{uid}` Firestore doc.
- [x] 6.2 Add a `userService` (new `src/entities/user/api/user.service.ts`) exporting `updateNotificationPrefs(uid, prefs)` that performs a `setDoc(..., { notificationPrefs: prefs }, { merge: true })`.
- [x] 6.3 Add the `User` type under `src/entities/user/model/types.ts` and export via `src/entities/user/index.ts` (matching the FSD layout of `concert` / `participation`).

## 7. Notification settings UI

- [x] 7.1 Create `src/features/notification-settings/notification-settings.ui.tsx` with a master switch and two category toggles ("Neue Konzerte", "Neue Teilnehmende"). Use the existing `ToggleRow` component from `@/shared/ui/toggle-row`.
- [x] 7.2 On master switch on → call `requestPermissionAndRegister(user)`; if it returns null (denied/unsupported), revert the switch and render the not-supported / denied hint.
- [x] 7.3 On master switch off → call `unregisterCurrentDevice(user)` and set both category toggles to disabled/hidden.
- [x] 7.4 On category toggle change → call `userService.updateNotificationPrefs` with the merged prefs.
- [x] 7.5 Detect and show the "install the PWA to enable notifications" hint when `isNotificationsSupported()` is false (covers iOS Safari in tab mode).
- [x] 7.6 Add a `/settings` route in `src/app/app.ui.tsx` (protected) and a corresponding `src/views/settings/` view that renders the `notification-settings` feature.
- [x] 7.7 Add a "Settings" / gear-icon link in `src/widgets/main-nav/main-nav.ui.tsx` and `src/widgets/mobile-nav-drawer/mobile-nav-drawer.ui.tsx` pointing at `/settings`. (Implemented in `app-sidebar` and `mobile-nav-drawer` — `main-nav` is the Kommende/Archiv tab bar, not a home for top-level nav items.)

## 8. Cloud Functions workspace

- [x] 8.1 Run `firebase init functions` in the repo, choose **TypeScript**, decline ESLint (the repo already has its own config), and install dependencies. Commit the generated `functions/` directory. (Scaffolded manually — the directory structure matches what the Firebase CLI generates for TypeScript + Node 20.)
- [x] 8.2 Align the `functions/` TypeScript target with the project (Node 20 runtime, `strict: true`). Remove the stock example function.
- [x] 8.3 Add shared types for notification payloads in `functions/src/types.ts` (`NotificationPayload`, `RecipientUser`).
- [x] 8.4 Add a utility `functions/src/lib/send-to-users.ts` that takes an array of uids + a message payload, reads each user's `fcmTokens` subcollection via the Admin SDK, calls `getMessaging().sendEachForMulticast`, and on per-token failures with invalid-token error codes deletes the matching `fcmTokens/{tokenId}` doc.
- [x] 8.5 Implement `functions/src/triggers/on-concert-create.ts` using `onDocumentCreated('concerts/{id}', ...)` (v2 Firestore trigger): read the new concert, query `users` where `notificationPrefs.newConcert == true`, drop the `createdBy` uid, call `sendToUsers` with title "Neues Konzert" and body `"${band} — ${date}"`, and `data: { concertId }`.
- [x] 8.6 Implement `functions/src/triggers/on-participation-create.ts` using `onDocumentCreated('participations/{id}', ...)`: read the participation, fetch the concert for `createdBy` + `band`, query co-participants, dedupe, drop the joiner, filter by `notificationPrefs.newParticipant == true`, and fan out with title like "Neue Zusage" and body `"${displayName} kommt ans ${band}-Konzert"`, `data: { concertId }`.
- [x] 8.7 Wire both triggers into `functions/src/index.ts` and export them.
- [ ] 8.8 Build: `cd functions && npm run build`; deploy: `firebase deploy --only functions`.

## 9. End-to-end verification

- [ ] 9.1 In a desktop Chrome, install the PWA (Chrome → "Install ConcertHub"), open Settings, enable notifications, confirm permission prompt and that `users/{uid}/fcmTokens/...` appears in Firestore.
- [ ] 9.2 In a second browser profile (or mobile device via https dev URL), sign in as a different user, enable notifications.
- [ ] 9.3 User A creates a concert → verify user B receives a push with the band name and that tapping it opens `/concert/{id}`. Verify user A does NOT receive a push.
- [ ] 9.4 User B joins the concert → verify user A (creator) receives a push. Verify user B does NOT receive a push.
- [ ] 9.5 User A disables only the "Neue Teilnehmende" toggle; user B joins a second concert → verify user A receives no push, but still receives pushes for new concerts.
- [ ] 9.6 User A toggles the master switch off → confirm `users/A/fcmTokens/*` is deleted and no further pushes arrive at that device.
- [ ] 9.7 In the Firebase Console → Functions logs, confirm no errors across the above flows.

## 10. Docs

- [x] 10.1 Add a "Push notifications" section to `CLAUDE.md` summarising the architecture (client module, SW, Functions) and the required env var.
- [x] 10.2 Update `environments/.env.example` comments to explain where the VAPID key comes from.
- [x] 10.3 Document the Blaze plan + Cloud Messaging API prerequisites in the repo README (or create a short `docs/notifications-setup.md`) so future deploys don't lose the manual steps.
