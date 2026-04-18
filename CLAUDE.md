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

The app ships as a PWA via `vite-plugin-pwa` (configured in `vite.config.ts`) — service worker and manifest are generated at build time.

### Deploy

Firebase Hosting serves the `dist/` output. Build with `npm run build`, then `firebase deploy`.

### Testing

- Framework: Vitest + `@testing-library/react`, JSDOM environment
- `vitest.config.mts` references `.test/vitest.globals.ts` (globalSetup) and `.test/vitest.setup.tsx` (setupFiles), plus a `@/test-utils` alias pointing at `.test/`. **Heads-up**: this `.test/` directory is currently missing from the repo — `npm test` will fail at startup until it's restored or the config is updated.
- `src/entities/**` and `src/app/**` are excluded from coverage
- No tests for `src/app/` or entity modules — focus on features/widgets/shared

### Tooling notes

- ESLint uses **flat config** (`eslint.config.mjs`) with `simple-import-sort` and `unused-imports` plugins — imports must be sorted and unused imports are errors.
- ESLint also enforces `@typescript-eslint/no-unsafe-member-access` as **error** (don't access properties on `any`-typed values — narrow or type them first) and `@typescript-eslint/no-explicit-any` as **warn**.
- Pre-commit hooks (Husky + lint-staged) run ESLint fix + Prettier on staged files.
- Semantic-release on `main` generates changelog and GitHub releases automatically.
- Conventional commits are enforced; use `npm run commit` for the interactive prompt.
- Unused variables must be prefixed with `_` (e.g., `_unused`) — the `unused-imports/no-unused-vars` rule enforces this via `varsIgnorePattern: '^_'`.
