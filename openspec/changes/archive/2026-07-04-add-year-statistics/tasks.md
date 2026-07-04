## 1. Aggregation helpers

- [x] 1.1 Create `src/shared/lib/year-stats/helpers.ts` exporting:
  - `parseConcertYear(dateString): number | null` (returns local-time `getFullYear()` or null on invalid)
  - `isAttended(concert, participations, viewerUid): boolean` (participation exists for this concert + viewer)
  - `isInYear(concert, year): boolean`
  - `isInPast(concert): boolean`
  - `attendedInYear(concerts, participations, viewerUid, year): Concert[]`
- [x] 1.2 Unit-test the helpers, especially the year-boundary cases (Jan 1, Dec 31, missing date string).

## 2. Stat aggregators (pure functions, one file each)

- [x] 2.1 `total-concerts.ts` exporting `totalConcerts(attendedConcerts): number`.
- [x] 2.2 `best-month.ts` exporting `bestMonth(attendedConcerts, locale): { monthIndex: number, count: number, label: string } | null`. Tie-break: later month. Locale-aware month label via `Intl.DateTimeFormat`. Returns null if input is empty.
- [x] 2.3 `top-buddies.ts` exporting `topBuddies(attendedConcerts, participations, viewerUid): { uid, displayName, count, latestSharedDate }[]`. **`participations` here must be _all_ participations of the attended concerts (every user), not just the viewer's** — co-attendance cannot be computed from viewer-only data. Returns at most 3. Tie-break: later `latestSharedDate`, then `displayName` ascending. Returns `[]` if input is empty.
- [x] 2.4 `top-genre.ts` exporting `topGenre(attendedConcerts): { genre, count } | null`. A concert with multiple genres contributes one to each. Tie-break: alphabetical ascending. Returns null if input is empty or no concert had any genres.
- [x] 2.5 `carpool-balance.ts` exporting `carpoolBalance(attendedConcerts, participations, viewerUid): { drove: number, rode: number, seatsOffered: number }`.
- [x] 2.6 `new-locations.ts` exporting `distinctLocations(attendedConcerts): number`.
- [x] 2.7 `first-and-last-show.ts` exporting `firstAndLastShow(attendedConcerts): { first: Concert | null, last: Concert | null }`. `first` = earliest by date, `last` = latest. May be the same concert when count is 1.
- [x] 2.8 `year-stats.ts` composite exporting `computeYearStats(concerts, participations, viewerUid, year)` calling all of the above and returning a single typed object.
- [x] 2.9 Unit tests per aggregator covering empty input, single-item input, ties.

## 3. Year selector

- [x] 3.1 In `src/shared/lib/year-stats/helpers.ts`, add `availableYears(concerts, participations, viewerUid): number[]` returning the descending list of years with at least one participation by the viewer, with the current year force-included even if empty.
- [x] 3.2 Build a small `<YearSelector value onChange options />` component as part of the statistics view (or as a generic in `shared/ui` if a second use case appears; YAGNI for now — keep it co-located).

## 4. Statistics view & route

- [x] 4.1 Create `src/views/statistics/statistics.ui.tsx`:
  - on mount, loads data with **two one-shot `getDocs` reads** (see design Decision 9): `concertService.getAll()` (all concerts incl. archived) and `participationService.getAll()` (all participations, every user — needed for co-attendance). No realtime `onSnapshot` listeners here — a yearly retrospective is a snapshot, not a live view. See task 6.
  - holds `loading` / `error` state around the fetch (the tiles render only once both reads resolve)
  - holds `selectedYear` state (default = current year)
  - composes `<YearSelector />` + the tile grid
- [x] 4.2 Create `src/views/statistics/index.ts` exporting the view.
- [x] 4.3 Register `/stats` in `src/app/app.ui.tsx` under the protected branch. Route renders `<StatisticsView />` inside the existing app shell.

## 5. Tiles

- [x] 5.1 Create `src/widgets/year-statistics/stat-tile.ui.tsx` — generic tile with props `{ headline, caption, icon?, onClick? }`. Mobile-first layout (full width on narrow, half on wider via existing Tailwind grid utils).
- [x] 5.2 `total-concerts-tile.ui.tsx` — uses `<StatTile />`.
- [x] 5.3 `best-month-tile.ui.tsx` — uses `<StatTile />` with month name as headline and "{count} Konzerte" as caption.
- [x] 5.4 `top-buddies-tile.ui.tsx` — bespoke tile with three rows (avatar + name + count). Uses the existing `Avatar` component.
- [x] 5.5 `top-genre-tile.ui.tsx` — uses `<StatTile />` with the genre as headline (using the genre color from `genre-gradients` for the small icon background).
- [x] 5.6 `carpool-balance-tile.ui.tsx` — bespoke tile with three sub-numbers and the captions "gefahren", "mitgefahren", "Sitze angeboten".
- [x] 5.7 `new-locations-tile.ui.tsx` — uses `<StatTile />`.
- [x] 5.8 `first-last-show-tile.ui.tsx` — bespoke tile with two mini-cards; each card is a button that navigates to `/concert/{id}` when tapped. Shows band + formatted date.
- [x] 5.9 Compose all tiles in `src/widgets/year-statistics/year-statistics.ui.tsx` and export it.

## 6. Service support

- [x] 6.1 Extend `participationService` with `getAll(): Promise<Participation[]>` — a one-shot `getDocs(collection(db, 'participations'))` mapping every doc into `Participation` (all users). This is the co-attendance source for "Top 3 Buddies"; a viewer-only query is insufficient (see design Decision 9). Read rule already allows it (`participations` is `read: if isSignedIn()`).
- [x] 6.2 Extend `concertService` with `getAll(): Promise<Concert[]>` — a one-shot `getDocs(collection(db, 'concerts'))` with **no** `isArchived` / date filter, so archived past concerts are included (the existing `getAllPast` excludes them). Year/past filtering happens client-side in the aggregation helpers.

## 7. Navigation entries

- [x] 7.1 Add a nav entry "Statistik" with a chart icon (e.g., `BarChart3` from `lucide-react`) to `src/widgets/app-sidebar/app-sidebar.ui.tsx` linking to `/stats`. Position it below the existing entries.
- [x] 7.2 Add the same entry to `src/widgets/mobile-nav-drawer/mobile-nav-drawer.ui.tsx`.

## 8. Empty state

- [x] 8.1 In `statistics.ui.tsx`, when `totalConcerts(attended) === 0`, render a single card with the text "Noch keine besuchten Konzerte in {jahr}." and a button linking back to `/`.
- [x] 8.2 The year selector remains rendered above the empty card so the user can still switch years.

## 9. End-to-end verification

- [x] 9.1 Seed test data: viewer with 5 attended concerts spread across two months, two genres, two locations, and three other participants (each appearing in 4 / 3 / 2 of the viewer's concerts respectively).
- [x] 9.2 Open `/stats`: confirm Konzerte total = 5, Bester Monat shows the month with 3 concerts, Top 3 Buddies show the three other participants in the correct order, Top Genre shows the more frequent genre, Carpool-Bilanz numbers match, Neue Locations = 2, Erste & letzte Show show the earliest / latest concert.
- [x] 9.3 Switch the year selector to a year with zero participations: confirm the empty-state card is shown and the selector still works.
- [x] 9.4 Tap the "Erste Show" card: confirm navigation to `/concert/{id}` and the existing detail modal renders.
- [x] 9.5 Mobile viewport: confirm the tile grid stacks to one column and is readable without horizontal scroll.

## 10. Docs

- [x] 10.1 Add a "Statistics" subsection to `CLAUDE.md` documenting the new `/stats` route and pointing at `src/shared/lib/year-stats/` as the source of aggregation logic.
