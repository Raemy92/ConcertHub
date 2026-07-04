## Why

After a year of using ConcertHub the app quietly holds a precious record: where the friend group spent their evenings, who they spent them with, what they listened to. Today none of that data is reflected back to the user — it just sits in the archive. A small, simple yearly stats view turns that data into a small annual moment ("krass, 14 Konzerte dieses Jahr — und ich war an 9 davon mit Bea") and reinforces what makes the app special for a tight-knit friend group: shared memory.

The constraint is simplicity. A stats view that nobody opens because it looks like a dashboard is worse than no stats view. Big numbers, plain language, mobile-first — that is the bar.

## What Changes

- Add a new protected route `/stats` and a `src/views/statistics/` view, reachable from the side nav (`app-sidebar`) and the mobile drawer (`mobile-nav-drawer`) with a chart / sparkle icon and the label "Statistik".
- Add a year selector at the top of the view (default: **current calendar year** by concert `date`; year options range from the earliest year the viewer has a participation in, down to the current year). Selecting "All time" is **not** offered in v1 — keeping the scope yearly is the point.
- Compute stats entirely client-side. No Cloud Function, no new data model, no new fields/collections/indexes. The aggregation does read more than the home view currently loads, though — it needs the viewer's full attended history, which the home view never fetches in one place: (a) **past concerts including archived ones** (the home "past" tab filters `isArchived == false`, so a year's archived concerts are otherwise never read), and (b) **all participations of each attended concert**, not just the viewer's own, because "Top 3 Buddies" is a co-attendance stat. These are done as **two one-shot `getDocs` reads** (whole `concerts` + whole `participations` collection) when the view opens — see the cost note below.
- Render the stats as **tiles** on a single scrollable page (mobile-first, two-up on wider screens). Each tile has one headline number and a short caption — no charts in v1.
- Stats in v1 (locked-in set, kept deliberately small):
  1. **Konzerte total** — count of concerts in the selected year (past date) where the viewer has a `participations` doc.
  2. **Bester Monat** — month with the most concerts. Tile shows the month name + count. Ties broken by latest month.
  3. **Top 3 Konzert-Buddies** — three users with the highest co-attendance count for the selected year (excluding the viewer themselves). Tile shows avatar + name + co-attended count, ranked.
  4. **Top Genre** — most-frequently-occurring genre across all attended concerts (a concert with multiple genres contributes one to each). Tile shows the genre label + count.
  5. **Carpool-Bilanz** — a three-stat sub-tile: "X mal gefahren · Y mal mitgefahren · Z Sitze angeboten". `gefahren` = participations with `isDriver = true`; `mitgefahren` = participations with `driverId` set; `Sitze angeboten` = sum of `availableSeats` across all driver participations.
  6. **Neue Locations** — number of distinct `concert.location` values attended in the selected year.
  7. **Erste & letzte Show** — two mini-cards showing the first and last attended concert of the year (band + date), tapping either jumps to its concert detail modal (reuses the existing `/concert/:id` route).
- Empty state: when the viewer has zero participations in the selected year, the page replaces all tiles with a single friendly card: "Noch keine besuchten Konzerte in {jahr}." with a link back to `/`.

## Capabilities

### New Capabilities

- `year-statistics`: a per-year, per-user reflective stats view summarising attendance, social co-attendance, music taste, carpool participation, venue diversity, and the year's first/last concert.

### Modified Capabilities

_None._ This change is purely additive — new route, new view, new aggregation logic. No existing spec is touched.

## Impact

- **Data:** none. Stats are derived from existing `concerts` + `participations`. No new fields, no new collections, no new indexes.
- **Code:**
  - new `src/views/statistics/statistics.ui.tsx` (page)
  - new `src/views/statistics/` index
  - new `src/widgets/year-statistics/` (the composed tile grid)
  - new `src/widgets/year-statistics/<tile>.ui.tsx` for each tile (kept as small files so individual stats can be added / removed / restyled without touching the others)
  - new `src/shared/lib/year-stats/` pure-function aggregators (testable in isolation: takes concerts + participations + viewerUid + year, returns the stat objects)
  - `src/app/app.ui.tsx` — register the `/stats` route under the protected branch
  - `src/widgets/app-sidebar/app-sidebar.ui.tsx` and `src/widgets/mobile-nav-drawer/mobile-nav-drawer.ui.tsx` — add the nav entry
- **No new env vars, no new dependencies.**
- **Performance:** for a 12-person group with ~50 concerts/year, full client aggregation is microseconds. No memoisation needed beyond the standard React rendering rules.
- **Firestore cost:** negligible. Opening the view is two one-shot collection reads. For this group the whole dataset is small — roughly ~50 concert docs/year and a few hundred participation docs/year, so one page load is on the order of a few hundred document reads (and grows only slowly, by whole-collection size, as history accumulates). Firestore's free tier is 50,000 reads/day and billing beyond it is ~$0.06 per 100,000 reads; you would need tens of thousands of page opens per day to leave the free tier, and even far beyond it the cost is fractions of a cent. Realistic usage (a yearly-retrospective view opened occasionally, peaking at year-end) stays comfortably free. Using **one-shot `getDocs` rather than realtime `onSnapshot` listeners** (see design Decision 9) keeps this a fixed, bounded read per visit instead of a set of long-lived listeners.
