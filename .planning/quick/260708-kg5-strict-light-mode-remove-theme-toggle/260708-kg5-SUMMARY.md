---
quick_id: 260708-kg5
slug: strict-light-mode-remove-theme-toggle
date: 2026-07-08
status: complete
commit: 5ccddad
---

# Quick Task 260708-kg5: Strict light mode + remove theme toggle

## Outcome
The Tessera terminal UI is now **light-only** with **no theme toggle**. Dark mode and the toggle control
are removed entirely. Home hero + its dark footer band (landing design) intentionally untouched.

## Changes (commit 5ccddad — 5 files, +24/−54)

| File | Change |
|------|--------|
| `src/App.tsx` | `theme` pinned to `'light'` (removed the `useState` + `tesseraTheme` localStorage read/write); `ui.dark=false`, `ui.theme='light'`, `toggleTheme` removed; deleted the now-unused `readLS` helper; dropped `theme` from the `useMemo` deps |
| `src/ui.ts` | removed `toggleTheme: () => void` from the `UI` interface (kept `dark`/`theme`) |
| `src/components/Nav.tsx` | removed the theme toggle `<button>`; moved `marginLeft:'auto'` onto the Watchlist button so it stays right-aligned |
| `src/index.css` | removed the now-unused `.nav-btn-label` rule (responsive nav 960/620 breakpoints unchanged) |
| `src/components/WatchlistDrawer.tsx` | converted hardcoded-dark → light: `data-tt-theme={ui.theme}` on the container + theme vars (panel `var(--t-bg)`, rows `var(--t-panel)`+`var(--t-hair)`, ink `var(--t-ink)`/`var(--t-ink3)`, gold `var(--t-gold)`); `changeColor(...,true)`→`changeColor(...,ui.dark)`; kept the `rgba(0,0,0,.55)` scrim |

## Verification (computed styles via preview_eval / preview_inspect)
- Overview: `data-tt-theme=light`, body `rgb(242,237,227)` (#F2EDE3), KPI ink `rgb(27,23,16)` (#1B1710) ✓
- IndexCard: bg `rgb(250,247,240)` (#FAF7F0), ink `rgb(27,23,16)` ✓
- Nav: only the `Watchlist` button — `navHasThemeToggle: false` ✓
- Watchlist drawer: `data-tt-theme=light`, panel `rgb(242,237,227)`, rows `rgb(250,247,240)`, ink `rgb(27,23,16)`, good contrast ✓
- No console errors ✓ · grep confirms no dangling `toggleTheme`/`readLS`/`tesseraTheme` refs ✓
- `pnpm typecheck` clean · `pnpm build` ✓ (778ms)

## Note
Could not capture a screenshot: the dev process leaks the Three.js hero's GPU context once the hero mounts,
so the screenshot tool's `document_idle` wait never resolves (a known tooling limitation — see
[[responsive-testing-on-this-env]]). Verified conclusively via DOM computed-style measurement instead.
Not deployed — user drives Vercel.
