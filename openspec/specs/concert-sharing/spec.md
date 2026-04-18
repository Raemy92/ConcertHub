# concert-sharing

## Purpose

Share-link affordance on concert entries — surfacing a per-concert share/copy action that produces the canonical detail URL.

## Requirements

### Requirement: Share action on each concert card

Every concert card in the concert list SHALL expose a share action that lets the user hand the concert's detail link to another person without having to open the detail view first. The action SHALL be available to every authenticated viewer regardless of whether they own, attend, or merely browse the concert.

#### Scenario: Share button is visible on every concert card

- **WHEN** an authenticated user sees a concert card in the list
- **THEN** the card displays a share button in its top-right action area, next to the existing calendar-download button
- **AND** the share button is shown even when the viewer is not the concert owner

#### Scenario: Share button does not navigate to the detail view

- **WHEN** the user taps the share button on a concert card
- **THEN** the share action runs
- **AND** the card's own navigation to the concert detail route does NOT fire

### Requirement: Share action produces the canonical concert detail URL

The share action SHALL deliver the absolute URL of the concert's detail route (`/concert/:id`) using the current origin, so the recipient can open the same URL-synced detail modal that the in-app "Details" button opens.

#### Scenario: URL uses current origin and concert id

- **WHEN** the share action runs for a concert with id `abc123`
- **THEN** the shared content contains the URL `<origin>/concert/abc123`, where `<origin>` is the application's current `window.location.origin`

#### Scenario: Share payload includes concert title

- **WHEN** the share action runs via the Web Share API
- **THEN** the share payload's title/text identifies the concert (e.g., the band name) so the recipient gets meaningful context, not only a bare URL

### Requirement: Native share sheet when supported, clipboard fallback otherwise

The share action SHALL prefer the platform's native share sheet (Web Share API) when the runtime supports it, and SHALL fall back to copying the URL to the clipboard when it does not. The fallback SHALL give the user visible confirmation that the link was copied.

#### Scenario: Native share sheet on supported devices

- **WHEN** the user taps the share button
- **AND** `navigator.share` is available in the current browser
- **THEN** the native share sheet opens with the concert title and detail URL pre-filled

#### Scenario: Clipboard fallback on unsupported browsers

- **WHEN** the user taps the share button
- **AND** `navigator.share` is not available
- **THEN** the concert detail URL is written to the clipboard via `navigator.clipboard.writeText`
- **AND** the button briefly indicates success (e.g., swaps to a check icon and/or updates its tooltip) before returning to its default state

#### Scenario: User cancels the native share sheet

- **WHEN** the native share sheet opens and the user dismisses it without sharing
- **THEN** no error is shown to the user
- **AND** the button returns to its default state

#### Scenario: Clipboard write fails

- **WHEN** the clipboard fallback runs and `navigator.clipboard.writeText` rejects
- **THEN** the button does NOT show a success confirmation
- **AND** the failure does not crash the card or the surrounding list
