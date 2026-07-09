---
quick_id: 260709-3au
slug: hero-count-aware-card-layout-2-live-card
date: 2026-07-09
status: complete
commit: bd2d101
---

# Quick Task 260709-3au: Hero — count-aware card layout (2 live cards)

## Problem
`POS` in `src/three/heroScene.ts` is a fixed 8-slot frame (top corners → mid sides → bottom row).
After the Renaiss cutover the live feed has **2 categories**, so `cards.slice(0,8)` landed both cards
in the **top corners** (`[-9, 3.6]`, `[8.4, 3.4]`) — top-heavy, edge-clipped, empty stage below.

## Fix (commit bd2d101)
- `layoutFor(count, aspect)`: count-aware arrangements. **2 cards → mid-height flanks (±7.2)** on wide
  viewports (aspect ≥ 1.05), **bottom pair (±2.1, −3.85)** on narrow/portrait (side flanks would be
  off-screen there). 1/3/4-card layouts included (the category set tracks what Renaiss publishes);
  ≥5 keeps the original 8-slot POS unchanged.
- Fewer cards render larger: plane geometry ×1.22 for ≤2 cards, ×1.1 for ≤4 — presence over sparseness.
- Flank x pulled in from ±9 → ±7.2 so both cards are **fully visible** (no edge clip) from laptop
  aspect (~1.6) upward; verified geometrically (card extent 8.54 vs visible half-width 9.9–12.2).

## Verification
- Geometry (deterministic): wide 2.11 aspect (live) → flanks fully visible mid-height beside the copy;
  phone 0.5 aspect → bottom pair at ±1.72 inside ±2.88 visible half-width.
- Dev preview (MockSource, 8 cards): hero mounts, zero console errors → ≥5 fallback regression-clean.
- Live (www.tesseraindex.xyz): new bundle `index-DLYRZBHC.js`, hero canvas running wide branch
  (2548×1210), **zero console errors**. WebGL frame capture unavailable (known tooling limitation —
  see memory `responsive-testing-on-this-env`); verified via geometry + runtime instead.
- `tsc` clean · 49/49 tests · build green · deployed via `vercel --prod`.
