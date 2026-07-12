---
quick_id: 260712-9da
slug: watchlist-empty-by-default-for-every-vis
date: 2026-07-12
status: complete
commit: b1fe8b4
---

# Watchlist empty by default + session-only

Two user requirements: (1) the watchlist starts empty for every visitor until they add
an index, and (2) it clears only on hard refresh / cookie clear (no persistence beyond
the page session).

Both were broken: `src/App.tsx` `readWatch()` seeded new visitors with
`['one-piece', 'sports']` (and `sports` is no longer a live category), and a `useEffect`
persisted the list to `localStorage['tesseraWatch']`, which survives hard refresh and
browser restart — the opposite of the requested lifetime.

## Change — in-memory only
Made the watchlist pure React state: deleted `readWatch()`, initialised
`useState<string[]>([])`, and removed the `localStorage.setItem` effect. `toggleWatch`
(add/remove) is untouched. Because the app is a SPA (screens switch via state, never a
page load), in-memory state survives all in-app navigation but resets to empty on any
full page reload and on cookie/site-data clear. sessionStorage was rejected: it survives
a hard refresh, which would fail requirement 2. Browsers don't expose hard-vs-soft reload
to JS, so "clear on hard refresh" is delivered as "clear on any full reload" — documented
in an App.tsx comment.

Also relabelled the drawer meta `LOCAL ONLY` → `SESSION ONLY` (the drawer already ships a
clean empty state: "Nothing pinned yet. Tap ◇ on any category card to track it here.").

## Verify
- No `tesseraWatch` / `readWatch` / `localStorage` left in code (explanatory comment aside).
- `tsc` clean · `vitest run` 49/49 · `vite build` green.
- Shipped bundle contains neither the `tesseraWatch` key nor the `one-piece,sports` seed.

## Ship
Code `b1fe8b4` (Bensage). Pushed to origin/main and deployed with `vercel --prod`; live
bundle re-checked for the dropped key. Private folders + `DEMO-VIDEO-SCRIPT.md` left
untracked/ignored.
