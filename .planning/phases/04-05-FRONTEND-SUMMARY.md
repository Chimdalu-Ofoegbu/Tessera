# Phases 4 & 5 — Frontend Views + Trust/Safety UI — SUMMARY

**Status:** Complete
**Requirements:** OVW-01/02/03, IDX-01, RISK-01/02/04, DET-01/02/03, PROV-01, PROV-03

The Claude Design "Gilded Terminal" handoff (HTML/CSS/JS prototype) was **recreated pixel-faithfully in React** and wired to the live API. Per the user's call, the demo runs on **8 real trading-card categories** (Pokémon Base/Japanese/Modern, One Piece Romance Dawn/Emperors, Basketball, Baseball + a deliberately-thin **Lorcana**), with the **full Three.js 3D hero**.

## What shipped

- **App shell** (`App.tsx`, `Nav.tsx`, `ui.ts`): screen state machine (home → overview → detail), dark/light theme toggle (localStorage), watchlist (localStorage), search, reduced-motion aware.
- **Landing hero** (`Hero.tsx` + `three/heroScene.ts`): 8 floating collectible cards in a fixed-camera Three.js scene (bob + momentum spin, hover-lift, drag-to-spin, click→detail), count-up KPIs from real data, category ticker. Three.js is **code-split** (lazy chunk; initial bundle 82 kB gzip).
- **Market Overview** (`Overview.tsx`, `IndexCard.tsx`): summary bento (real total volume/listings/movers), 8 category cards with sparkline + risk chip + provenance, live search, insufficient-data card state (Lorcana).
- **Category Detail** (`Detail.tsx`, `IndexChart.tsx`, `RiskPanel.tsx`): stat bento, interactive index chart (range pills + crosshair tooltip + shimmer loading + insufficient panel), trading-activity bars, **Risk Score panel** (48px score, tier chip, confidence band, 4-factor breakdown with definitions), recent-sales table (sales tied to real card names via nearest-price match).
- **Watchlist drawer** + **home footer**.
- **Data plumbing**: `api/client.ts` + TanStack Query hooks; `lib/view.ts` maps the engine's `RiskBreakdown` → the design's four "goodness" meters + tier colors + confidence band + chart paths. A **Vite dev-API middleware** (`vite.config.ts`) serves the real `/api` from the compute layer locally (matches prod).

## The three non-negotiables — all live

1. **Source + freshness on every metric** — every KPI, card, stat, chart, and risk panel carries a `SRC … · UPD …` line from the provenance envelope.
2. **Risk always shows its work** — the panel renders the four reconciling factors + confidence band + per-factor definitions + the engine version (`risk@1.1.0`); no black box.
3. **Insufficient-data instead of fabrication** — Lorcana renders the live INSUFFICIENT DATA / NOT SCORED states across card, index chart, volume, risk panel, and sales table.

## Calibration

Risk tuned against the seed fixtures (roadmap-flagged): `TARGET_OBS 40→160` + per-category observation depth so the composite spreads **LOW → MODERATE** (PKM 8 · PKB 15 · PKJ/MLB 26 · OPE 33 · OPR 36 · NBA 39) with the concentration (NBA/Jordan) and volatility (OPR/OPE) stories visible, and Lorcana insufficient. `risk@1.1.0`, methodology doc updated.

## Verification

- `pnpm exec tsc` → 0; `pnpm exec vitest run` → **48 tests pass**; `pnpm build` → 0.
- Validated live in the Preview: hero (3D cards + real ticker), overview (real totals + varied risk chips + Lorcana insufficient), detail (OPE — stat bento, risk panel 4 factors + band 30–48, recent sales with real card names).
- **Known tooling note:** the Preview *screenshot* capture times out on the WebGL hero page (a headless-capture quirk); the app itself is responsive (DOM snapshots + `eval` confirm) and renders correctly in a real browser.

## Notes / follow-ups for Phase 6

- Live deploy on Vercel (SPA rewrite + `/api` functions already configured) — needs the user's Vercel auth; optional `USE_RENAISS=1` for live Renaiss data.
- Bundle: three.js chunk (131 kB gzip) loads only on home — acceptable.
