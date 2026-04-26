# Push Notifications Setup

This document captures the one-time manual steps required to make push
notifications work in ConcertHub. The code side is in the repo; Firebase
settings and plan changes live in the project console and cannot be
checked in.

## Prerequisites

### 1. Generate a VAPID (Web Push) key — free, works on Spark

1. [Firebase Console](https://console.firebase.google.com) → select the
   ConcertHub project.
2. Gear icon next to **Project Overview** → **Project settings**.
3. Tab **Cloud Messaging**.
4. Scroll to **Web configuration** → **Web Push certificates**.
5. Click **Generate key pair**. Copy the resulting public key.
6. In the repo, add to `environments/.env.local`:
   ```
   VITE_FIREBASE_VAPID_KEY=<the-public-key-you-just-copied>
   ```

### 2. Confirm the Firebase Cloud Messaging API is enabled

1. Still in **Project settings → Cloud Messaging**, look for the
   **Firebase Cloud Messaging API (V1)** row at the top.
2. Should show **Enabled**. If not, click through to Google Cloud Console
   and enable it.

### 3. Upgrade to Blaze (required only for Cloud Functions)

FCM itself is free on the Spark plan — but **deploying the Cloud Functions
that trigger the notifications** needs the Blaze pay-as-you-go plan.

1. Firebase Console → bottom-left **Spark plan** → **Upgrade**.
2. Choose **Blaze: Pay as you go** and link a billing account.
3. Immediately set a safety net: **Usage and billing → Details & settings
   → Budget alerts** → create a 1 USD/month alert. Expected runtime cost
   stays inside Blaze's always-free tier.

### 4. Firebase CLI

On your dev machine:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # pick the ConcertHub project — creates .firebaserc
```

## Deploy order

```bash
# 1. Security rules — new file, first deploy is required so tokens work.
firebase deploy --only firestore:rules

# 2. Cloud Functions — builds TypeScript, deploys both triggers.
firebase deploy --only functions
```

## Verifying end-to-end

1. `npm run build && npm run preview` (or deploy to Hosting).
2. Install the PWA (Chrome → "Install ConcertHub"), sign in.
3. Navigate to **Einstellungen**, turn on push. Browser prompts for
   permission; accept. Firestore should now show
   `users/<uid>/fcmTokens/<tokenId>` with a `token` field.
4. From a second account on another browser/device: sign in, enable push.
5. Create a concert from account A → account B gets a push with the band
   name. Tapping it opens `/concert/<id>`.
6. Account B joins the concert → account A (creator) gets a push.

## Troubleshooting

- **No push arrives, but no error**: check Firebase Console → **Build →
  Functions → Logs**. `sendToUsers: delivered` should log success/failure
  counts. If `failureCount > 0`, the token may have been pruned.
- **Permission stays `default` after clicking Allow**: on iOS, push only
  works for PWAs installed to the home screen (iOS 16.4+). Tab-mode
  Safari is not supported.
- **`getToken` throws with `messaging/failed-service-worker-registration`**:
  make sure the service worker at `/sw.js` is registered and active
  (Chrome DevTools → Application → Service Workers). On dev, PWA is
  enabled via `devOptions.enabled` — reload once after first start.
- **Functions deploy fails with "Billing account required"**: the project
  is still on Spark. Re-check step 3.
