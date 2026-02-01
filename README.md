# ConcertHub

Eine kleine React/Vite-Webapp zum Planen von Konzertbesuchen: Konzerte anlegen & bearbeiten, Teilnahme verwalten und Mitfahrgelegenheiten/Beifahrer-Zuordnung organisieren. Authentifizierung und Datenhaltung laufen über Firebase (Auth + Firestore).

## Tech-Stack

- **React 19** + **TypeScript**
- **Vite** (Dev/Build)
- **Firebase**: Authentication + Firestore
- **Tailwind CSS**
- **ESLint** + **Prettier**
- **Vitest** + Testing Library
- **PWA** (vite-plugin-pwa)

## Voraussetzungen

- Node.js (aktuelle LTS empfohlen)
- npm (kommt mit Node)
- Ein Firebase-Projekt (Auth + Firestore)

## Quickstart

1. Dependencies installieren

```bash
npm install
```

2. Environment-Variablen konfigurieren

Die App liest Firebase-Konfiguration aus `environments/`.

- Kopiere `environments/.env.example` nach `environments/.env.local`
- Trage deine Firebase-Werte ein

Benötigte Variablen:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Hinweise:

- Die Vite-Konfiguration nutzt `envDir: './environments'` (siehe `vite.config.ts`).
- **Keine Secrets committen**: Stelle sicher, dass echte Werte nicht versehentlich in Git landen.

3. App starten

```bash
npm run dev
```

## NPM Scripts

Aus `package.json`:

- `npm run dev` – lokale Entwicklung
- `npm run build` – Formatieren + Production Build
- `npm run preview` – Vorschau des Builds
- `npm run test` – Tests einmalig ausführen
- `npm run test:watch` – Tests im Watch-Mode
- `npm run test:ui` – Vitest UI
- `npm run lint` – ESLint
- `npm run lint:fix` – ESLint mit Auto-Fixes
- `npm run format` – Prettier Check
- `npm run format:fix` – Prettier Write

## Projektstruktur (kurzer Überblick)

Das Projekt ist nach einem feature-orientierten Ansatz strukturiert:

- `src/app/` – App-Shell, Provider, globale Styles
  - `src/app/providers/auth.provider.tsx` – AuthContext (Firebase Auth + User-Profil aus Firestore)
- `src/views/` – Seiten/Routes (z. B. Home, Login, Register)
- `src/widgets/` – größere UI-Blöcke (Listen, Cards, Details)
- `src/features/` – abgeschlossene Features (Forms, Toggles, Car-Management)
- `src/entities/` – Domänenmodelle und entity-spezifische APIs
  - `src/entities/concert/api/concert.service.ts` – Firestore-Zugriffe (Konzerte/Teilnahmen)
- `src/shared/` – wiederverwendbare Bausteine
  - `src/shared/api/firebase/config.ts` – Firebase Init (Auth/Firestore/Provider)
  - `src/shared/ui/` – UI-Komponenten (Modal, Inputs, …)

## Firebase

### Collections (aktueller Stand)

Aus dem Code (siehe `src/entities/concert/api/concert.service.ts`):

- `concerts`
  - u. a. `date` (YYYY-MM-DD), `isArchived`, `createdAt`, `updatedAt`
- `participations`
  - Teilnahme pro User & Konzert (Dokument-ID: `${concertId}_${userId}`)
  - u. a. `concertId`, `userId`, `driverId`, `joinedAt`
- `users`
  - wird beim Login/Register gepflegt (siehe `src/shared/auth/auth-service.ts`)

### Auth

Unterstützt:

- E-Mail/Passwort
- Google Sign-In

(Implementiert in `src/shared/auth/auth-service.ts`)

## Hosting / Deploy

In `firebase.json` ist Firebase Hosting auf den Vite-Build-Output `dist/` konfiguriert.

Typischer Ablauf:

1. Build erstellen

```bash
npm run build
```

2. Deploy via Firebase CLI (wenn eingerichtet)

```bash
firebase deploy
```

> Hinweis: Die Firebase CLI-Konfiguration (Login, Projektzuordnung) passiert außerhalb dieses Repos.

## Qualität: Linting & Formatting

- ESLint läuft über `eslint.config.mjs`
- Prettier ist als Formatter konfiguriert

Hilfreich im Alltag:

```bash
npm run lint:fix
npm run format:fix
```

## Tests

- Unit/Component-Tests: **Vitest** + **@testing-library/react**

```bash
npm run test
```

## PWA

Die App ist als PWA konfiguriert über `vite-plugin-pwa` (siehe `vite.config.ts`).
Icons/Manifest werden dort definiert.

## Contributing

- Commits: Es sind Commit-Hilfen/Checks vorhanden (Husky + Commitlint + cz-git).
- Empfohlen: vor dem Commit `npm run lint` und `npm run test` laufen lassen.
