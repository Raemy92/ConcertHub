## 1. Share helper

- [x] 1.1 Create `src/shared/lib/share.ts` exporting `shareOrCopy({ title, text?, url }): Promise<'shared' | 'copied' | 'cancelled' | 'failed'>`.
- [x] 1.2 Implement Web Share path: if `typeof navigator.share === 'function'` and (`!navigator.canShare || navigator.canShare(data)`), call `navigator.share(data)`; map resolve → `'shared'`, `AbortError` → `'cancelled'`, other reject → fall through to clipboard.
- [x] 1.3 Implement clipboard fallback: call `navigator.clipboard.writeText(url)`; resolve → `'copied'`, reject → `'failed'`. Never throw out of the helper.
- [x] 1.4 Add unit tests under `src/shared/lib/share.test.ts` covering: native share success, native share cancel (`AbortError`), native share failure falls through to clipboard, clipboard copy success, clipboard copy failure, and the "no `navigator.share`" path (stub globals on a per-test basis).

## 2. Concert card UI

- [x] 2.1 In `src/widgets/concert-card/concert-card.ui.tsx`, import `Share2` and `Check` from `lucide-react` and `shareOrCopy` from `@/shared/lib/share`.
- [x] 2.2 Add local state `const [justCopied, setJustCopied] = useState(false)` and a ref-backed timeout so it can be cleared on unmount.
- [x] 2.3 Add `handleShareClick(e: MouseEvent)` that calls `e.stopPropagation()`, then calls `shareOrCopy({ title: concert.band, url: \`${window.location.origin}/concert/${concert.id}\` })`. On `'copied'`, set `justCopied`to`true` and schedule a 2000 ms timeout to reset it.
- [x] 2.4 Render a new icon button before `CalendarPlus` in the top-right action cluster, using the same className pattern as the existing icon buttons. Icon swaps between `Share2` (default) and `Check` (when `justCopied`). Title swaps between `'Link teilen'` and `'Link kopiert'`.
- [x] 2.5 Guard the button so it does nothing if `concert.id` is falsy (matches the existing `ParticipationToggle` guard).
- [x] 2.6 Clear the pending timeout in a `useEffect` cleanup so the component never calls `setJustCopied` after unmount.

## 3. Verification

- [x] 3.1 `npm run lint` passes (import sort, unused-imports, no-unsafe-member-access).
- [x] 3.2 `npm run test` passes, including the new `share.test.ts`.
- [x] 3.3 Manual check in `npm run dev`: on desktop Chrome, the button copies the URL and the icon briefly flips to `Check`; on a mobile browser (or DevTools mobile emulation with Web Share enabled), the native share sheet opens. In both cases, tapping the share button does NOT open the concert detail modal.
- [x] 3.4 `npm run build` succeeds.
