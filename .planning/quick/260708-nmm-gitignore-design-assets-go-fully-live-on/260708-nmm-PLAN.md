---
quick_id: 260708-nmm
slug: gitignore-design-assets-go-fully-live-on
date: 2026-07-08
status: in-progress
---

# Quick Task 260708-nmm: gitignore design assets + go fully live on Renaiss

## Part 1 — gitignore (DONE, no commit needed)
`Tessera - UI Handoff/` + `Tessera - Brand Social Assets/` were already ignored in committed
.gitignore (lines 32-33) with zero tracked files. The pending `M .gitignore` was Vercel-CLI-appended
duplicates (`.vercel`, `.env*` — the latter broke `!.env.example`); reverted → .gitignore == HEAD.

## Part 2 — fully live on Renaiss
Prod = static `/api/*.json` snapshot (CDN; @vercel/node cross-dir limitation; 10 req/day anon cap).
"Fully live" = regenerate the snapshot from the REAL API through RenaissSource and redeploy.

### Live-API findings (probe 2026-07-08, spend 4/10 requests)
- `/v1/health` ok, source renaiss. `/v1/indices`: **2 games live** (pokemon PKM idx 11,255.7 · d7 −2.15;
  one-piece OPC idx 20,811.6 · d7 −3.22), 50 constituents each, confidence high, asOf 2026-07-07. No sports tile today.
- **Defect exposed:** live sparkline points omit `n` → mapper defaulted to 0 → `computeRisk`
  (totalObs<5) and `buildIndex` (no base point n≥2) both returned INSUFFICIENT for healthy real data.
- **Label bug exposed:** mapper feeds `deltas.d7` into `change24h`; UI prints "24H" → a 7-day delta
  mislabeled as 24-hour. Must relabel to 7D (provenance-first product).

### Changes
1. `src/data/renaiss/map.ts` — `mapSeriesPoint(p, fallbackN=0)`: a published index point with absent/
   non-positive `n` inherits the tile's constituent backing (fallbackN = constituentCount). NOT fabrication:
   the point is a published aggregate; "no per-point disclosure" ≠ "zero observations". Engines untouched
   (still gate honestly: thin tiles → insufficient via sampleSize/staleness/series-length).
2. `src/data/renaiss/RenaissSource.ts` — getIndexSeries passes fallbackN = raw.constituentCount.
3. Tests — new case: real-shaped tile (sparkline without `n`) maps to n=constituentCount and scores.
4. UI labels — "24H" → "7D": IndexCard, Overview (AVG INDEX · 7D, TOP MOVERS — 7D), heroScene card
   texture; schema.ts comment. Drop hardcoded "· 6 VENUES" (unverifiable on live data).
5. Snapshot — regen via `USE_RENAISS=1` dev middleware (port 5199) into staging → validate (parse,
   source==='renaiss', 2 categories, risk.ok, indexSeries.ok) → swap `public/api/` (delete 8-category
   seed files; write pokemon + one-piece sets). Budget ≤8/10 calls total.
6. Docs — README (ids/count/live-snapshot note + regen instructions), DEMO.md (rewrite beats around
   2 real categories; Lorcana/NBA beats are seed-only now), STATE.md row.
7. `pnpm typecheck` + `pnpm test` + `pnpm build` green → commit (clean authorship) → `vercel --prod`
   → verify live overview source==='renaiss'.

### Accepted consequences (surface in report)
- Site shows 2 real categories (was 8 seed): grids/hero/counters all computed — no layout breakage.
- Live thin-category demo (PROV-02's Lorcana beat) no longer triggers — safe-state remains in engines,
  tests, and MockSource; a thin real category would trip it automatically.
- totalVolume (floor×listings proxy) reads ~$10K on real data (was $5.53M seed) — honest, smaller.

## Guardrails
No Claude/Anthropic attribution (Bensage only) · subagents inherit · do not exceed 10 upstream calls/day.
