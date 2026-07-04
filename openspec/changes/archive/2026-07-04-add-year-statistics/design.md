## Context

ConcertHub already reads the `concerts` and `participations` collections for the home and detail views, but never the full slice the stats view needs at once: the home "past" tab excludes archived concerts (`getAllPast` filters `isArchived == false`), and per-concert participation listeners only cover the concerts of the currently open tab. Stats are still computed entirely client-side and introduce no new schema or backend — but the view must load a bit more than the home view: the viewer's full attended history and, for co-attendance, everyone else's participations too. How that data is loaded (and why cheaply) is Decision 9.

The view's audience is a friend group, not a power-user dashboard. Anything fancier than "one big number per tile" loses people.

## Goals / Non-Goals

**Goals:**

- Single scrollable page, mobile-first, tiles with one headline number each.
- Computes a small, locked-in set of stats — additions later are easy but v1 is restrained.
- Per-calendar-year scoping with a year selector defaulting to the current year.
- All tiles render from in-memory data — no per-tile Firestore calls.
- Tiles render gracefully when data is missing (e.g., no carpool data ⇒ "0 mal gefahren" etc.; no concerts at all ⇒ empty-state card).
- Tap-through from the "Erste & letzte Show" mini-cards into the existing concert detail modal.

**Non-Goals:**

- Charts (bar / line / pie / sparkline). Adds visual weight without information density for these counts.
- Aggregating across multiple users for a "group leaderboard". The view is personal.
- Year-over-year comparison ("you went to more shows than last year"). Maybe in v2.
- Goals / streaks / achievements (gamification). Out of scope.
- "All-time" tab. Yearly framing is the point — a year is a natural unit for friend-group nostalgia.
- Sharing the stats (e.g., as an image card to WhatsApp). Could be a fun v2 but adds image generation complexity.
- Export to CSV / PDF.

## Decisions

### Decision 1: Concert is "attended" iff it has a participation and its date is in the past

**Choice:** A concert counts toward stats for a given (viewer, year) iff:

- there exists a `participations` doc with `userId == viewer.uid` and `concertId == concert.id`,
- `concert.date` falls in the selected calendar year, and
- `concert.date` is **strictly in the past** relative to the current local date.

**Why:** Stats should reflect what you actually did, not what you signed up for. A concert next month — even if you've joined — is not yet an experience. The past-date check filters this naturally.

**Trade-off:** If the date string is malformed or missing, the concert is excluded. Acceptable — `concert.date` is required by the create form.

### Decision 2: `isArchived` is not used as the gate

**Choice:** Archival status does NOT enter the stats computation; only the date check does.

**Why:** Archival is a manual concert-owner action and may lag behind reality. Using date is deterministic and timezone-stable enough for friend-group purposes (we use local date).

### Decision 3: Aggregators are pure functions, lives in `src/shared/lib/year-stats/`

**Choice:** Each stat is computed by a tiny pure function: `(concerts, participations, viewerUid, year) → result`. The view composes them. No React state besides what's needed for the year selector.

**Why:** Testable in isolation, no Firestore mocks needed. Adding / removing tiles becomes "add or remove a function call in the view".

**File sketch:**

```
src/shared/lib/year-stats/
  index.ts
  year-stats.ts            // composite function returning all stats
  helpers.ts                // date parsing, year filter, "attended" predicate
  total-concerts.ts
  best-month.ts
  top-buddies.ts
  top-genre.ts
  carpool-balance.ts
  new-locations.ts
  first-and-last-show.ts
  *.test.ts                 // unit tests per aggregator
```

### Decision 4: Tile component is a small generic, not a per-stat custom

**Choice:** One reusable `<StatTile />` component takes `{ headline, caption, icon? }`. Tiles that need richer layout (Carpool-Bilanz with three sub-numbers, Top 3 Buddies with avatars, Erste & letzte Show with two clickable mini-cards) are bespoke components in `widgets/year-statistics/`.

**Why:** Most stats fit the simple "big number + small caption" template. The three that don't deserve their own component rather than bending the generic.

### Decision 5: Year selector lists years where the viewer has at least one participation

**Choice:** The year dropdown lists every year in which the viewer has at least one participation (any date, past or future), plus the current year unconditionally. Sorted descending. Default selected = current year.

**Why:** Avoids showing 2019 if the user has no data there. The "current year unconditionally" rule means a brand-new user lands on a sensible empty state for the current year rather than a blank dropdown.

### Decision 6: Tied stats — pick the latest

**Choice:** When a stat could be ambiguous (e.g., two months with the same concert count), pick the **latest** option (later month, later genre by alphabetical order — pragma: latest matches user expectation for time-based ties, alphabetical for non-time ties).

**Why:** Deterministic, simple, doesn't try to be clever.

### Decision 7: "Top 3 Buddies" counts unique concerts only

**Choice:** A "co-attendance" is one shared concert. The Top 3 ranks other users by the number of distinct concerts they share with the viewer in the selected year.

**Why:** Anything more elaborate (weighting carpool, weighting same-genre, etc.) loses the simple "we went to N shows together" framing.

**Tie-break:** higher most-recent-shared-concert date wins; then by display name ascending.

### Decision 8: Tap-through reuses the existing modal route

**Choice:** Tapping "Erste Show" or "Letzte Show" calls `navigate('/concert/${id}')`. The existing nested route renders the detail modal on top of the home view. Closing the modal returns to home, NOT to `/stats`.

**Why:** Reuses existing infrastructure. The slight UX wart (close goes to home, not back to stats) is acceptable for v1; can be fixed later by stacking the modal over the stats view too.

**Future:** If this becomes annoying, register `/stats/concert/:id` as a sibling nested route reusing the same modal component.

### Decision 9: Load the data as two one-shot `getDocs` reads of the whole collections, not per-concert realtime listeners

**Choice:** When the stats view mounts, fetch the data with exactly two one-shot reads:

- `getDocs` of the whole `concerts` collection (a new `concertService.getAll()` — no `isArchived` / date filter, so archived past concerts are included), and
- `getDocs` of the whole `participations` collection (a new `participationService.getAll()`).

Then compute everything client-side. The viewer's own participations and every co-attendee's participations both come out of that single participations read; no per-concert query and no `where('concertId', 'in', …)` chunking (which is capped at 30 and would need splitting).

**Why:**

- **Correctness:** "Top 3 Buddies" is a co-attendance stat, so it needs the participations of _other_ users on each attended concert — not just the viewer's. A viewer-only participation query (e.g. `where('userId', '==', viewerUid)`) cannot compute it. Reading the whole participations collection is the simplest sufficient source. (The stats scenarios that require it are covered in the spec.)
- **Archived history:** the year's older concerts are typically archived, and no existing query returns archived concerts, so `getAll()` (unfiltered) is required to see them.
- **Cost stays trivial:** for a 12-person group the whole `concerts` and `participations` collections are small (order hundreds of docs), so a visit is a few hundred reads — see the cost note in the proposal. Reading whole collections is fine at this scale and stays well inside the free tier.
- **One-shot over realtime:** a yearly retrospective is a snapshot, not a live dashboard — it does not need to re-render when someone joins a concert mid-view. `getDocs` gives a bounded, fixed read per visit; `onSnapshot` would open long-lived listeners for no benefit. The home view's per-concert `onSnapshot` fan-out is deliberately _not_ reused here.

**Trade-off:** the numbers are as of page load; a refresh (or re-navigation) picks up new data. Acceptable for this view. Both read rules already permit it — `concerts` and `participations` are `read: if isSignedIn()`.

**Scale note:** whole-collection reads scale with total history, not with the selected year. For this friend group that is fine for years. If the collections ever grew large enough to matter, the fetch could be narrowed (e.g. participations by `where('userId','==', viewerUid)` for the viewer's own carpool stats plus a chunked `where('concertId','in', …)` for co-attendees) without changing any aggregator — the pure functions take the same in-memory arrays regardless of how they were fetched.

## Risks / Trade-offs

- **Aggregation correctness on edge dates (year boundaries):** mitigated by using local-date comparisons (`new Date(concert.date).getFullYear()`) and explicit unit tests for Jan 1 / Dec 31 entries.
- **Visual emptiness when the user has only 1 concert this year:** the page will look thin but still informative. We render every tile; numbers like "0 mal gefahren" or "Bester Monat: November (1)" are honest. Only the full-empty case (0 concerts) collapses into the single empty-state card.
- **Names changing between years:** since `participations.displayName` is denormalised at write time (existing project pattern), the "Top 3 Buddies" tile may show the historical name. Acceptable, matches the rest of the app.
- **Privacy:** stats are personal — they aggregate only what the viewer attended. Nothing in the rendering reveals data the viewer didn't already have access to.

## Migration

- None. The view is purely derived from existing data.
