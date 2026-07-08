---
quick_id: 260708-nmm
slug: gitignore-design-assets-go-fully-live-on
date: 2026-07-08
status: complete
commits: [c658fe5, 371dbe9, 1125728]
---

# Quick Task 260708-nmm: gitignore design assets + fully live on Renaiss

## Outcome
**Production now runs on live Renaiss Index API data end-to-end** — https://tessera-terminal.vercel.app
serves 2 real categories (pokemon · one-piece), every metric `source: "renaiss"`, risk scored
(8 LOW / 11 LOW), index published 30/30 points rebased to 100. Verified live via API + real-browser DOM.

Part 1 (gitignore): both design-asset folders were **already ignored** (committed .gitignore lines
32–33, zero tracked files). Reverted a Vercel-CLI-appended duplicate diff (`.vercel`, `.env*` — the
latter broke `!.env.example`). No commit needed; verified with `git check-ignore`.

## What going live surfaced (and fixed)

| Finding | Fix | Commit |
|---|---|---|
| Live sparkline omits per-point `n` → mapper read 0 → risk + index both INSUFFICIENT on healthy data | `mapSeriesPoint(p, fallbackN)`: undisclosed points inherit the tile's constituentCount (published aggregate ≠ zero observations); disclosed n preserved; engines untouched; regression test (49th) | c658fe5 |
| `/api/index/{id}` leaked Renaiss's native base level (10000) as `base` | emits the rebased-series basis (100) per contract | c658fe5 |
| UI printed `deltas.d7` as "24H" | all display-delta labels → **7D** (cards, overview, hero 3D texture) | c658fe5 |
| "VOLUME — TRAILING 30D" was floor×listings | relabeled **FLOOR VALUE — LISTINGS** (+ derivation in detail sub) | c658fe5 |
| Hardcoded "SRC AUCTION FEED" / "6 VENUES" fictions | real source label / computed count ("N CATEGORIES TRACKED") | c658fe5 |
| Live tier discloses no per-sale rows → bare table | explicit "No per-sale records disclosed… NOTHING WITHHELD BY TESSERA" state | c658fe5 |
| Snapshot was seed | regenerated from live API (5 upstream calls; ≤8/10 daily budget incl. probes); seed per-category files (8 ids) deleted | 371dbe9 |
| README/DEMO described seed build | rewritten for live ids/provenance/regen steps; demo beats around real numbers (PKM vs OPC volatility story) | 1125728 |

## Live verification
- API: overview `source: renaiss`, cats pokemon(8)/one-piece(11), asOf 2026-07-07; detail risk+series ok,
  provenance renaiss; index base 100 current 81.05; health ok. Bundle: "FLOOR VALUE" in, "AUCTION FEED" gone.
- Browser (real Chrome, live URL): 2 cards w/ RISK 8 & 11 chips, TOP MOVERS — 7D, TOTAL FLOOR VALUE,
  2 CATEGORIES TRACKED, SRC RENAISS INDEX, zero "24H"/"AUCTION FEED" strings.
- Gates: tsc clean · 49/49 tests · build green. Rate budget: ≤8/10 anonymous calls used today.

## Notes / accepted consequences
- Category set now tracks what Renaiss publishes (2 today; sports absent from the live feed). New games
  appear on snapshot regen automatically.
- The live thin-category (Lorcana) demo beat no longer exists in prod — withhold-don't-estimate is
  demonstrated by the sales-disclosure state + engine-gated insufficiency (unit-tested); MockSource keeps
  the on-demand Lorcana demo in dev.
- User's own working-tree deletions (tessera-build-spec.md, tessera-ui-design-prompt.md) left untouched.
