## Why

Users who want to invite friends to a concert currently have to open the detail view first and copy the URL from the browser's address bar. A share action directly on the concert card would remove that friction and make it one-tap to send the shareable detail link to someone else.

## What Changes

- Add a share icon button to the action area in the top-right of each `ConcertCard`, placed alongside the existing calendar and edit buttons.
- On tap, the button uses the Web Share API when available (mobile / PWA context) to invoke the native share sheet with the concert title and its absolute detail URL (`/concert/:id`).
- On desktop or when Web Share is unavailable, the button falls back to copying the URL to the clipboard and briefly confirms the copy (icon swap + title text) so the user knows it worked.
- The button must not trigger card navigation (stop propagation) and must not depend on the user being signed in as the owner — every user sees it for every concert.

## Capabilities

### New Capabilities

- `concert-sharing`: Share-link affordance on concert entries — surfacing a per-concert share/copy action that produces the canonical detail URL.

### Modified Capabilities

<!-- No existing specs to modify (openspec/specs/ is empty). -->

## Impact

- **Affected code**: `src/widgets/concert-card/concert-card.ui.tsx` (new button + handler); new shared helper for share/copy behavior (likely `src/shared/lib/share.ts`).
- **Dependencies**: No new runtime dependencies. Uses the existing `lucide-react` icon set (`Share2`, `Check`) and standard Web APIs (`navigator.share`, `navigator.clipboard`).
- **Browser compatibility**: Web Share API is not universal on desktop browsers; the clipboard fallback must cover that case. Both APIs require a secure context (HTTPS / localhost), which the app already runs in.
- **No data model or Firestore changes.**
