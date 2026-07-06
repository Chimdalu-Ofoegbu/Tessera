# 03-01 — Compute & Cache Layer — SUMMARY

**Status:** Complete
**Requirements:** API-01 (substance)

## What shipped

- `src/lib/cache.ts` — `memo(key, ttlMs, now, fn)` TTL memo + `clearComputeCache()` (injected `now` for determinism).
- `src/lib/compute.ts` — the source→engines→payload service layer:
  - `buildCategoryAnalytics(source, id, now)` — fetches `getCategory` + `getIndexSeries(365)`, runs `computeRisk` + `buildIndex` on the raw series using the category's own provenance (source/asOf/confidence/sampleSize), computes `floor` (min priced constituent, `Metric<Money>`) and `volume` (Σ transaction sales). Returns `CategoryAnalytics`.
  - `buildCategoryCard(a)` — projects analytics → the overview card (index + risk chip + sparkline + deltas).
  - `buildOverview(source, now)` — cards for all categories + `totalListings` + `totalVolume` + `topMovers`. `Overview`.
  - All memoized (60s TTL). Payload types exported for the frontend wiring.

## Verification

- `pnpm exec tsc` → 0; `pnpm exec vitest run src/lib` → **6 tests pass**.
- Asserts: overview 4 cards with provenance on index AND risk; **lorcana insufficient for risk + index + floor end-to-end**; pokemon ok + reconciling risk + ok index; sports floor = min priced constituent (30000); positive totals; memo returns same reference within TTL.

## Notes

- A bare number cannot appear: `index`, `risk`, `floor`, `indexSeries` are all `Metric`-wrapped; a thin category degrades to insufficient across the whole payload.
- Payload shapes match `tessera-ui-design-prompt.md` (overview cards: index value/%/sparkline/risk chip; detail: floor/volume/recent sales/index series/risk breakdown).
