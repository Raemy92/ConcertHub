## ADDED Requirements

### Requirement: Dedicated yearly statistics view at `/stats`

The application SHALL provide a protected route `/stats` rendering a per-year personal statistics view for the authenticated user. The view SHALL be reachable from the existing app sidebar and the mobile navigation drawer via a "Statistik" entry.

#### Scenario: Authenticated user reaches the stats view

- **WHEN** an authenticated user navigates to `/stats`
- **THEN** the `StatisticsView` is rendered inside the existing app shell

#### Scenario: Unauthenticated user is redirected to login

- **WHEN** an unauthenticated visitor navigates to `/stats`
- **THEN** the existing `ProtectedRoute` redirects to `/login`, preserving `/stats` as the intended URL

#### Scenario: Navigation entries are present

- **WHEN** the user opens the app sidebar (desktop) or the mobile navigation drawer
- **THEN** a "Statistik" entry with a chart-style icon is shown, linking to `/stats`

### Requirement: Year selector defaults to the current year and lists years with viewer history

The view SHALL include a year selector at the top. The selector SHALL list every calendar year in which the viewer has at least one participation (any date, past or future), plus the **current calendar year** unconditionally, sorted descending. The initial selected value SHALL be the current calendar year.

#### Scenario: Selector defaults to the current year

- **WHEN** the user opens `/stats` for the first time
- **THEN** the year selector shows the current calendar year as selected

#### Scenario: Selector includes only years with data + current year

- **WHEN** the viewer has participations in 2024 and 2026 and today is in 2026
- **THEN** the selector lists `2026, 2024` in descending order

#### Scenario: Brand-new user still sees the current year

- **WHEN** the viewer has zero participations
- **THEN** the selector lists exactly `[currentYear]`

### Requirement: A concert counts toward stats iff attended and in the past

A concert SHALL be counted for the (viewer, selectedYear) tuple iff (a) a `participations` document exists with `userId == viewer.uid` and `concertId == concert.id`, (b) `concert.date` falls within the selected calendar year using the local timezone, and (c) `concert.date` is strictly earlier than the current local date. Archival status SHALL NOT be used as the gate.

#### Scenario: Future concert this year is excluded

- **WHEN** the viewer joined a concert with `date` later in the current calendar year
- **THEN** the concert is NOT counted in any current-year stat

#### Scenario: Past concert from the selected year is counted

- **WHEN** the viewer has a participation for a concert with `date` earlier than today, within the selected year
- **THEN** the concert is counted in all relevant stats

#### Scenario: Archived past concert is counted

- **WHEN** the concert satisfies (a), (b), (c) above and has `isArchived == true`
- **THEN** the concert is still counted (archival status is irrelevant)

#### Scenario: Concert with a malformed date is excluded

- **WHEN** `concert.date` cannot be parsed to a local date
- **THEN** the concert is excluded from all stats and does not throw

### Requirement: Konzerte total tile

The view SHALL render a "Konzerte total" tile showing the count of concerts attended by the viewer in the selected year.

#### Scenario: Tile shows the correct count

- **WHEN** the viewer attended exactly 7 qualifying concerts in the selected year
- **THEN** the tile's headline number is `7` and the caption reads "Konzerte"

#### Scenario: Tile shows zero gracefully

- **WHEN** the viewer attended zero qualifying concerts in the selected year
- **THEN** the tile is replaced by the empty-state card (see the empty-state requirement)

### Requirement: Bester Monat tile

The view SHALL render a "Bester Monat" tile showing the localized month name with the highest attended-concert count and the count itself. On ties, the **later** month wins.

#### Scenario: Single peak month

- **WHEN** the viewer attended 3 concerts in March, 1 in May, 1 in October
- **THEN** the tile's headline shows "März" (or the user's localized month name) and the caption reads "3 Konzerte"

#### Scenario: Tied months — later wins

- **WHEN** the viewer attended 2 concerts in February and 2 in August
- **THEN** the tile's headline shows "August"

### Requirement: Top 3 Konzert-Buddies tile

The view SHALL render a "Top 3 Buddies" tile listing up to three other users ranked by the number of distinct attended concerts they share with the viewer in the selected year, descending. The viewer SHALL never appear in the list. Ties SHALL be broken by latest shared concert date, then by display name ascending. The tile SHALL show each buddy's avatar, display name, and the shared-concert count.

#### Scenario: Ranking by shared count

- **WHEN** in the selected year the viewer shared 6 concerts with `A`, 4 with `B`, 3 with `C`, 1 with `D`
- **THEN** the tile lists `A (6), B (4), C (3)` in that order
- **AND** `D` is not shown

#### Scenario: Fewer than three buddies present

- **WHEN** the viewer shared concerts with only one other user
- **THEN** the tile shows that single buddy and the remaining slots are not rendered as empty placeholders

#### Scenario: Viewer is not listed

- **WHEN** computing the buddies list
- **THEN** the viewer's own `uid` is excluded from candidates

#### Scenario: No buddies (lone attender)

- **WHEN** every attended concert had no other participants
- **THEN** the tile shows a placeholder like "Niemand sonst dabei gewesen"

### Requirement: Top Genre tile

The view SHALL render a "Top Genre" tile showing the genre that occurs most frequently across the viewer's attended concerts in the selected year, with its count. A concert with multiple genres contributes one to each. Ties SHALL be broken alphabetically ascending.

#### Scenario: Single dominant genre

- **WHEN** the attended set yields genre counts `{ Rock: 5, Indie: 3, Punk: 1 }`
- **THEN** the tile shows "Rock" with the caption "5 Konzerte"

#### Scenario: No genres at all

- **WHEN** none of the attended concerts have any genres set
- **THEN** the tile shows a placeholder like "Noch keine Genres erfasst"

### Requirement: Carpool-Bilanz tile

The view SHALL render a "Carpool-Bilanz" tile with three sub-numbers: **gefahren** (count of attended-year participations with `isDriver == true`), **mitgefahren** (count with a non-empty `driverId`), and **Sitze angeboten** (sum of `availableSeats` over all driver participations in scope).

#### Scenario: All three numbers compute independently

- **WHEN** the viewer drove to 3 concerts (with `availableSeats` 3, 2, 4) and rode with someone else at 2 concerts
- **THEN** the tile shows `3 gefahren · 2 mitgefahren · 9 Sitze angeboten`

#### Scenario: Zero carpool involvement

- **WHEN** the viewer never drove and never rode in the selected year
- **THEN** the tile shows `0 gefahren · 0 mitgefahren · 0 Sitze angeboten`

### Requirement: Neue Locations tile

The view SHALL render a "Neue Locations" tile showing the count of distinct `concert.location` values across the viewer's attended concerts in the selected year. Comparison SHALL be case-sensitive and trim-insensitive on whitespace.

#### Scenario: Distinct locations counted

- **WHEN** the viewer attended concerts at locations `["Bierhübeli", "Reitschule", "Bierhübeli", "Kaserne"]`
- **THEN** the tile's headline number is `3`

### Requirement: Erste & letzte Show tile

The view SHALL render two mini-cards labelled "Erste Show" and "Letzte Show" showing the earliest- and latest-by-date attended concerts of the selected year. Tapping either card SHALL navigate to `/concert/{id}` for that concert. If only one attended concert exists, both cards SHALL show the same concert.

#### Scenario: Both cards point to distinct concerts

- **WHEN** the viewer attended ≥ 2 concerts in the year
- **THEN** Erste Show shows the earliest-dated concert and Letzte Show shows the latest-dated concert

#### Scenario: One attended concert

- **WHEN** the viewer attended exactly one concert in the year
- **THEN** both cards show that same concert

#### Scenario: Tapping navigates to the concert detail

- **WHEN** the user taps a mini-card for concert with id `xyz`
- **THEN** the app navigates to `/concert/xyz`
- **AND** the existing concert detail modal opens

### Requirement: Empty state replaces the tile grid when there is no data

When the total-concerts count for the (viewer, selectedYear) is zero, the view SHALL replace the entire tile grid with a single friendly card stating that the viewer has not yet been to any concerts in the selected year, with a link back to the home view. The year selector SHALL remain visible above the empty card so the viewer can switch years.

#### Scenario: Empty year shows the empty card

- **WHEN** the viewer has zero qualifying concerts for the selected year
- **THEN** the tile grid is NOT rendered
- **AND** a single card is rendered with the message "Noch keine besuchten Konzerte in {jahr}." and a button linking to `/`

#### Scenario: Year selector still works in the empty state

- **WHEN** the empty-state card is visible
- **AND** the user changes the year to one where they have data
- **THEN** the tile grid is rendered for the new year and the empty card disappears

### Requirement: Stats compute purely from existing data, no new storage

The statistics view SHALL compute all values client-side from the existing `concerts` and `participations` collections, without requiring any new Firestore fields, collections, indexes, or Cloud Functions. It MAY read more of those existing collections than other views currently do (archived concerts and all users' participations, for co-attendance), fetched as one-shot reads on view load; it SHALL NOT introduce new stored data or backend triggers.

#### Scenario: No new schema or backend pieces are introduced

- **WHEN** the change is implemented
- **THEN** no migration, no new collection, no new field, no new index, no new Cloud Function is required to render any stat
- **AND** all stats are computed in the client from the existing `concerts` and `participations` documents
