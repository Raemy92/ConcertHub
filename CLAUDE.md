# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start Vite dev server
npm run build         # Format + production build
npm run preview       # Preview production build

# Testing
npm run test          # Run tests once (Vitest)
npm run test:watch    # Watch mode
npm run test:ui       # Vitest UI dashboard
npm run test:update   # Update snapshots
npm run test:related  # Run tests related to changed files

# Linting & Formatting
npm run lint          # Check ESLint
npm run lint:fix      # Auto-fix ESLint
npm run format        # Check Prettier
npm run format:fix    # Auto-format

# Commits & Releases
npm run commit        # Interactive conventional commit (czg)
npm run semantic-release:dry  # Dry-run release
```

## Architecture

ConcertHub is a **React 19 + TypeScript + Firebase** PWA for managing concert attendance with carpool coordination. It uses a feature-layered architecture inspired by Feature-Sliced Design.

### Layer structure (`src/`)

| Layer       | Purpose                                                                          |
| ----------- | -------------------------------------------------------------------------------- |
| `app/`      | App shell, global styles, routing, `AuthProvider`                                |
| `entities/` | Domain types and entity-scoped Firestore services (`concert/`, `participation/`) |
| `features/` | Self-contained interaction units (forms, toggles, carpool management)            |
| `widgets/`  | Larger composed UI blocks (lists, cards, detail views)                           |
| `views/`    | Full-page route components                                                       |
| `shared/`   | Firebase config/init, auth service, reusable UI components                       |

### Entity structure (FSD)

Each entity slice follows `model/types.ts` + `api/<name>.service.ts`:

- `entities/concert/` — Concert type + CRUD service (`getAllUpcoming`, `getById`, `create`, `update`, `archive`)
- `entities/participation/` — Participation type + service (`join`, `leave`, `subscribeByConcert`, `assignPassenger`, `removePassenger`, `updateTicketStatus`)

### Data flow

- **Auth**: `AuthProvider` (`src/app/providers/auth.provider.tsx`) wraps the app and exposes user state via `useAuth()`. Routes are guarded by `ProtectedRoute` (preserves intended URL on redirect).
- **Database**: Firestore access goes through entity services. Key collections: `concerts`, `participations`, `users`.
- **Auth actions**: `src/shared/auth/auth-service.ts` handles login/register/logout/Google sign-in.

### Key domain concepts

- **Concert**: A gig with band info, location, date/time, price, and an `isArchived` flag.
- **Participation**: Links a user to a concert, tracks `hasTicket`, `isDriver`, `availableSeats`, and `driverId` (for carpooling passengers). Document ID convention: `${concertId}_${userId}`.

### Routing

Routes in `src/app/app.ui.tsx`:

- `/login`, `/register` — public auth pages
- `/` — protected home (concert list)
- `/concert/:id` — nested under `/`, opens concert detail as a URL-synced modal (shareable link, no page reload)

### Path aliases (`@` → `src/`)

Sub-aliases are configured in `tsconfig.json` and `vite.config.ts`:
`@/app`, `@/entities`, `@/features`, `@/widgets`, `@/views`, `@/shared`

### Styling

Tailwind CSS **v4** via `@tailwindcss/vite` plugin — configuration is CSS-based (no `tailwind.config.js`). Use `tailwind-merge` (`twMerge`) for conditional class merging.

### Environment & Firebase

Vite is configured with `envDir: './environments'` (see `vite.config.ts`), so `VITE_FIREBASE_*` vars are read from there — not from `.env` at the repo root. Copy `environments/.env.example` to `environments/.env.local`. Firebase is initialized in `src/shared/api/firebase/config.ts`.

### PWA

The app ships as a PWA via `vite-plugin-pwa` configured in `strategies: 'injectManifest'` mode (see `vite.config.ts`). The service-worker source lives at `src/sw.ts` and is bundled at build time. The SW does two jobs: Workbox precaching + runtime caching of third-party assets, and Firebase Cloud Messaging background-message handling (`onBackgroundMessage`, `notificationclick`).

### Push notifications

- **Client**: `src/shared/notifications/notifications.service.ts` handles permission prompt, FCM token registration (`getToken` with the VAPID key from `VITE_FIREBASE_VAPID_KEY`), and unregister. Tokens live at `users/{uid}/fcmTokens/{tokenId}` in Firestore.
- **UI**: `src/features/notification-settings/` + `/settings` route (via `src/views/settings/`) lets users opt in and toggle three categories: `newConcert`, `newParticipant`, and `newComment`. Preferences persist on `users/{uid}.notificationPrefs`. `newConcert` and `newParticipant` default to `true` when the master switch is first enabled; `newComment` defaults to `false` (opt-in) and a missing field is treated as `false` server-side.
- **Server**: Firestore triggers in `functions/` (Cloud Functions v2, `europe-west1`, Node 20) fan out push notifications. `onConcertCreate` pings opted-in users when a concert is created (excluding the creator). `onParticipationCreate` pings the concert creator and co-participants when someone joins (excluding the joiner). `onCommentCreate` pings the concert creator and all participants when a new comment is posted (excluding the author). Invalid tokens are pruned on send.
- **Required env var**: `VITE_FIREBASE_VAPID_KEY` — generate in Firebase Console → Project settings → Cloud Messaging → Web Push certificates.
- **Deploy prerequisites**: Blaze plan (for Cloud Functions — FCM itself is free on Spark). Rules live in `firestore.rules`. Deploy order: `firebase deploy --only firestore:rules`, then `firebase deploy --only functions`.

### Concert comments

- **Storage**: per-concert subcollection `concerts/{concertId}/comments/{commentId}` with `{ text, authorId, authorDisplayName, createdAt, updatedAt? }`. `createdAt` and `updatedAt` are Firestore server timestamps (written via `serverTimestamp()`, enforced in the rules with `== request.time`) so ordering cannot be spoofed by clients; the service converts them to ms epoch numbers on read. `authorDisplayName` is resolved at write time via `userService.resolveDisplayName(uid, fallback)` — same shared helper the participation service uses; it reads `users/{uid}.displayName` and falls back to the caller-supplied name.
- **Service**: `src/entities/comment/api/comment.service.ts` exposes `subscribeByConcert`, `post`, and `edit`. Comments are ordered by `createdAt` ascending. The schema caps text length at 1–2000 chars (enforced in both the service and the security rules).
- **Posting access**: only the concert's creator or a current participant (a doc at `participations/{concertId}_{uid}`) can create comments — enforced both client-side (the input bar is hidden with a hint) and server-side in `firestore.rules`. Editing an own comment is **not** re-gated on participation, so an author who later leaves the concert can still fix typos in their old comments. The rules also lock down the writable field set: create allows only `text/authorId/authorDisplayName/createdAt`; update allows only changes to `text` and `updatedAt`.
- **UI**: `src/widgets/concert-comments/` is a collapsible accordion mounted at the bottom of the concert detail view. Reads are open to every signed-in user. Own comments render right-aligned with the accent color; others render left-aligned with a deterministic per-author color from `src/shared/ui/user-color/`. Authors can edit (but not delete) their own comments; edited entries show "(bearbeitet)" next to the timestamp.
- **Notifications**: opt-in `newComment` category triggers `onCommentCreate` in `functions/src/triggers/on-comment-create.ts` — fans out to the concert creator + all current participants, minus the author, filtered by `notificationPrefs.newComment == true`. Body is `"{author} ({band}): {first 80 chars of text}"`; tap routes to `/concert/{id}`.

### Deploy

Firebase Hosting serves the `dist/` output. Build with `npm run build`, then `firebase deploy`.

### Testing

- Framework: Vitest + `@testing-library/react`, JSDOM environment
- `vitest.config.mts` references `.test/vitest.globals.ts` (globalSetup) and `.test/vitest.setup.tsx` (setupFiles — runs `cleanup()` after each test), plus a `@/test-utils` alias pointing at `.test/`.
- `src/entities/**` and `src/app/**` are excluded from coverage
- No tests for `src/app/` or entity modules — focus on features/widgets/shared

### Tooling notes

- ESLint uses **flat config** (`eslint.config.mjs`) with `simple-import-sort` and `unused-imports` plugins — imports must be sorted and unused imports are errors.
- ESLint also enforces `@typescript-eslint/no-unsafe-member-access` as **error** (don't access properties on `any`-typed values — narrow or type them first) and `@typescript-eslint/no-explicit-any` as **warn**.
- Pre-commit hooks (Husky + lint-staged) run ESLint fix + Prettier on staged files.
- Semantic-release on `main` generates changelog and GitHub releases automatically.
- Conventional commits are enforced; use `npm run commit` for the interactive prompt.
- Unused variables must be prefixed with `_` (e.g., `_unused`) — the `unused-imports/no-unused-vars` rule enforces this via `varsIgnorePattern: '^_'`.

### Spec-driven changes (OpenSpec)

The repo uses OpenSpec (`openspec/` with `changes/` and `specs/` subfolders, driven by `openspec/config.yaml`). For non-trivial work, prefer the OpenSpec skills (`/openspec-propose`, `/openspec-apply-change`, `/openspec-archive-change`) over ad-hoc edits so proposals, specs, and tasks stay in sync.
