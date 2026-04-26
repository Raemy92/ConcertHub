## Context

The concert list (`src/widgets/concert-list`) renders a `ConcertCard` for each concert. Each card is a clickable surface that navigates to `/concert/:id`, which opens the detail view as a URL-synced modal (already shareable by URL — see `src/app/app.ui.tsx`). The top-right of the card currently hosts two icon buttons: `CalendarPlus` (always visible) and `Edit2` (owner only). This change adds a third icon button — share — to the same cluster.

There is an existing pattern for "bare-DOM helpers" in `src/shared/lib/` (e.g. `ics.ts` which implements `downloadConcertIcs`). A share helper fits the same shape: a small, side-effectful function the card calls from its click handler.

## Goals / Non-Goals

**Goals:**

- Add a per-card share affordance that produces the canonical absolute detail URL (`<origin>/concert/:id`).
- Prefer the native share sheet via `navigator.share` when available; otherwise copy the URL to the clipboard.
- Give the user visible confirmation when the clipboard fallback succeeds.
- Keep the behavior isolated in a reusable helper so the same logic can later be dropped into the detail view if desired.

**Non-Goals:**

- No deep-link / unlisted-link generation, tokenized URLs, or access-controlled sharing. The detail route is already reachable by any signed-in user.
- No toast/notification system. Confirmation is expressed via the button's own icon swap — we do not introduce a global toast library here.
- No sharing to specific platforms (Twitter/WhatsApp/etc.) with hand-rolled URLs. The Web Share API covers this on platforms that expose it; anywhere else, clipboard is the fallback.
- No analytics/tracking of shares.

## Decisions

### Decision: Put the share helper in `src/shared/lib/share.ts`

Mirrors the `ics.ts` neighbor: a pure-ish helper that touches browser APIs and returns a promise. Signature:

```ts
type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareOrCopy(input: {
  title: string
  text?: string
  url: string
}): Promise<ShareResult>
```

Rationale: the card only needs to know _which outcome happened_ so it can decide whether to show the "copied" confirmation. Returning a small union keeps the UI logic trivial and testable without mocking DOM globals from inside the component.

**Alternatives considered:**

- _Inline the logic in the card._ Rejected — we'd have to duplicate it the moment we want to share from the detail view, and it makes the card component harder to unit-test.
- _Use a custom `useShare` hook that owns state._ Rejected — adds a React abstraction for a one-shot side effect. The card already needs local state for the "copied" confirmation anyway; a hook buys nothing and hides the API surface.

### Decision: Detect Web Share support with `typeof navigator.share === 'function'`, with a canShare-aware data payload

`navigator.share` is absent on most desktop Chromium builds and on Firefox. On supported platforms, `navigator.canShare(data)` additionally lets us verify the payload shape is accepted before calling `share()`. The helper will:

1. If `navigator.share` is a function and (`!navigator.canShare || navigator.canShare(data)`), call `navigator.share(data)`.
2. If the call resolves → `'shared'`. If it rejects with `AbortError` (user cancel) → `'cancelled'`. Any other rejection → fall through to clipboard.
3. Otherwise, call `navigator.clipboard.writeText(url)`. Resolve → `'copied'`. Reject → `'failed'`.

Rationale: treating a non-abort `share()` failure as "try clipboard" gives us a graceful second chance on mobile browsers that advertise `navigator.share` but fail at call time (known on some iOS in-app webviews).

### Decision: Confirmation UX is a 2-second icon swap on the button

When the helper resolves to `'copied'`, the card swaps the `Share2` icon for `Check` and updates the button title to "Link kopiert" for ~2 seconds, then reverts. Language stays German to match the rest of the card (`Bearbeiten`, `Zum Kalender hinzufügen`). The timeout is cleared on unmount to avoid setting state after unmount.

**Alternatives considered:**

- _Global toast._ Rejected — no toast infra exists today, and introducing one for this is out of scope.
- _Persistent "copied" state._ Rejected — a sticky confirmation is confusing after a few seconds; a short-lived swap matches user intuition.

### Decision: Icon is `Share2` from `lucide-react`

Already a dependency. `Share2` is the neutral "share arrow" glyph that reads as "share _or_ copy" more clearly than the platform-specific `Share` icon. `Check` is used for the success state (also already part of lucide).

### Decision: Authentication gating follows the existing card

The share button is rendered whenever the card is rendered. The concert list is only reachable through `ProtectedRoute`, so in practice the viewer is always authenticated — but the button itself has no auth dependency, which matches the spec ("every user sees it for every concert").

## Risks / Trade-offs

- **Risk**: `navigator.clipboard.writeText` requires a secure context (HTTPS / localhost). → Mitigation: production is served over HTTPS via Firebase Hosting; dev is localhost. No extra handling needed, but the helper must not throw if the call rejects — just return `'failed'`.
- **Risk**: Some in-app webviews (Instagram, Facebook) expose `navigator.share` but reject at call time with non-`AbortError` errors. → Mitigation: the two-step fallback (share → clipboard) handles this silently.
- **Risk**: The button increases visual density in the top-right corner of the card, especially for owners who already see the edit button. → Mitigation: the share button uses the same icon-button styling (`p-2`, 4×4 icon) and is placed before `Edit2`, so the cluster reads as a single action group rather than crowding any one button.
- **Trade-off**: No global toast means the confirmation is easy to miss if the user is looking elsewhere. Acceptable for an already-reversible action (re-tap to re-copy) and keeps the change small.

## Migration Plan

Not applicable — additive UI change, no data or schema migration, no feature flag. Ship behind normal review. Rollback is reverting the PR.

## Open Questions

None.
