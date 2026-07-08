---
quick_id: 260708-hoh
slug: responsive-fixes-nav-collapse-detail-sal
date: 2026-07-08
status: in-progress
---

# Quick Task 260708-hoh: Responsive fixes — nav collapse + detail sales-table overflow

## Problem (from Chrome DevTools audit @ 375/768/1280px)

Desktop ≥~1024px is flawless. Below that, two defects from fixed pixel widths that can't reflow:

1. **Nav bar** — `SearchGroup` is `position:absolute; left:50%` (Nav.tsx), floating independent of the
   logo (left) and Dark/Watchlist buttons (right). Measured @375: overlaps logo 77px, Dark 83px,
   Watchlist spills 20px off-screen → whole-page horizontal scroll. @768: search still overlaps Dark 75px.
2. **Recent Sales table** — `cols = 'minmax(220px,1fr) 90px 100px 90px 150px'` (Detail.tsx:73) ≈698px min
   → 386px page horizontal-scroll on every scored category detail @375.

Optional: WatchlistDrawer fixed `width:344` — cap to `min(344px,88vw)` for <344px phones.

## Approach

CSS-media-query driven (no JS resize listener); desktop layout untouched ≥961px. Add className hooks to
inline-styled nodes and drive responsive behavior from `src/index.css` (which already has an `@media` block).

### Task 1 — Nav responsive (src/components/Nav.tsx + src/index.css)
- Add `className="nav-bar"` to the inner nav container, `className="nav-search"` to the SearchGroup wrapper,
  and wrap the theme-toggle text (`LIGHT`/`DARK`) in `<span className="nav-btn-label">`.
- index.css:
  - `@media (max-width:960px)` → `.nav-search` becomes `position:static` (no float → no overlap);
    hide `.search-input` (MARKETS link stays).
  - `@media (max-width:620px)` → hide `.nav-search` entirely (MARKETS redundant with breadcrumb / Enter
    Terminal on mobile); shrink `.nav-bar` padding 32→16 & gap 24→14; hide `.nav-btn-label` (icon-only theme).
- **files:** src/components/Nav.tsx, src/index.css
- **verify:** preview_eval nav-overlap probe @375/768/1280 → no logo/search/Dark/Watchlist overlaps; page `scrollWidth-clientWidth===0` on home + overview.
- **done:** nav fits ≥320px with no overlap; desktop centered-search unchanged ≥961px.

### Task 2 — Recent Sales table contained scroll (src/components/Detail.tsx)
- Wrap the header grid + row `.map` (scored branch only) in `<div style={{ overflowX:'auto' }}>` so the
  table scrolls WITHIN its card instead of dragging the page. All 5 columns + all data preserved (honest).
  The `src`/updated line stays outside the scroll wrapper (full width).
- **files:** src/components/Detail.tsx
- **verify:** preview_eval overflow probe on a scored detail (NBA) @375 → page `scrollWidth-clientWidth===0`; desktop still fills (no scrollbar) @1280.
- **done:** scored detail has zero page horizontal-scroll on mobile; desktop table visually unchanged.

### Task 3 — Drawer width cap (src/components/WatchlistDrawer.tsx)
- `width: 344` → `width: 'min(344px, 88vw)'`.
- **files:** src/components/WatchlistDrawer.tsx
- **verify:** drawer ≤ viewport on 320–375px; unchanged on desktop (min → 344).
- **done:** drawer never exceeds small-phone width.

## Do NOT touch (verified responsive)
Hero (clamp headline + flex-wrap counters), overview bento (auto-fit), category cards (auto-fill),
detail stat cards (auto-fit), chart/risk-panel flex wrap, insufficient-data states.

## Guardrails
- No Claude/Anthropic git attribution (commits by Bensage only).
- Verify at 375/768/1280 via Claude_Preview (screenshots hang on WebGL hero → DOM measurement there).
- No desktop regression.
