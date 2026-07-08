---
quick_id: 260708-hoh
slug: responsive-fixes-nav-collapse-detail-sal
date: 2026-07-08
status: complete
commit: e3006bc
---

# Quick Task 260708-hoh: Responsive fixes — nav collapse + detail sales-table overflow

## Outcome

Fixed the two responsive defects surfaced by the Chrome-DevTools audit (@375/768/1280). Desktop
(≥961px) is untouched; mobile + tablet are now clean. Verified with CDP device-emulation + DOM
overflow/overlap probes on home, overview, and a scored detail (NBA/Basketball) at all three widths.

## Changes (commit e3006bc)

| File | Change |
|------|--------|
| `src/components/Nav.tsx` | className hooks: `.nav-bar` (container), `.nav-search` (search group), `.nav-btn-label` (theme-toggle text span) |
| `src/index.css` | `@media (max-width:960px)` un-floats `.nav-search` + hides the search input; `@media (max-width:620px)` hides the search group, tightens `.nav-bar` padding/gap, and hides `.nav-btn-label` (icon-only theme toggle) |
| `src/components/Detail.tsx` | wrapped the scored Recent Sales grid (header + rows) in an `overflow-x:auto` container → table scrolls within its card, not the page; all 5 columns + data preserved |
| `src/components/WatchlistDrawer.tsx` | `width: 344` → `width: min(344px, 88vw)` |

## Verification (page `scrollWidth − clientWidth`, nav overlaps)

| Screen | 375 (mobile) | 768 (tablet) | 1280 (desktop) |
|--------|--------------|--------------|----------------|
| Home | overflow **0**; search hidden | — | search centered (absolute) |
| Overview | overflow **0**; logo/dark/watch overlaps **0**; watch within viewport; theme icon-only | overflow **0**; no overlaps | unchanged (172px gap to Dark) |
| Detail (NBA) | overflow **0** (was **386**); table scrolls in card (scrollW 706 > clientW 265) | overflow **0** | table fills, no scrollbar (1160=1160) |

Before → after page horizontal-scroll: overview 20→0, scored detail 386→0, nav overlaps (77/83/75px)→0.

`pnpm typecheck` clean · `pnpm build` ✓ (1.15s). No desktop regression.

## Notes
- The WatchlistDrawer 20px overflow in the audit was a symptom of the nav overflow (fixed `right:0`
  anchoring to the overflowed page width); it resolves with the nav fix. The width cap is defense for <344px phones.
- Search input is intentionally hidden below 961px (secondary feature); it returns on desktop where demos run.
- Not yet redeployed — live URL updates on the next Vercel deploy (user drives deploy).
