---
quick_id: 260712-7db
slug: add-tessera-product-favicon-public-favic
date: 2026-07-12
status: complete
commit: 1846364
---

# Add Tessera product favicon (replace tab placeholder)

The browser tab showed the generic placeholder page icon because `index.html` declared
no favicon and `public/` held no icon asset. Created `public/favicon.svg` reproducing the
in-code brand mark (`Nav.tsx` `Logo()` — the 2×2 tile diamond, a *tessera*) exactly: same
grid, same 45° rotation, same home colors (gold `#C9A961` · green `#2E8065` · dark-gold
`#8F6F26` · ink `#1B1710`). Tiles sit on a cream `#F2EDE3` rounded-square plaque with a
hairline edge so the ink tile and plaque stay legible on both light and dark tab strips —
a transparent mark would lose the ink tile on a dark strip.

Wired into `index.html`: `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` plus
`<meta name="theme-color" content="#F2EDE3">` (matches the strict-light paper; tints mobile
browser chrome). SVG-only — modern evergreen browsers (the demo target) render it crisply
at any size; no binary `.ico` (keeps the surface small; optional future fallback for pre-SVG
browsers noted in the plan).

## Verification
- SVG well-formed: 5 rects (plaque + 4 tiles), `viewBox="0 0 32 32"`, `rotate(45 16 16)`, all
  5 brand colors present.
- `pnpm build` green (1.08s); `dist/favicon.svg` emitted (710 B, verbatim) and `dist/index.html`
  `<head>` carries both new tags with Vite's script/style injected after — head is valid.
- Rendered inline at 16/24/32/64px on light (#ffffff) and dark (#202124) strips + mock Chrome
  tabs: all four tiles read at 16px on both backgrounds.
- Browser pane was unresponsive (known WebGL-env flakiness) — used build-output checks + an
  inline widget render instead; playwright is no longer installed in scratchpad.

## Notes
- Not yet deployed. `vercel --prod` (or a push, if a Git integration is connected) will ship
  the favicon live; tabs may need a hard-refresh to drop the cached placeholder.
- Authorship clean (Bensage only). Private folders untouched and still ignored.
