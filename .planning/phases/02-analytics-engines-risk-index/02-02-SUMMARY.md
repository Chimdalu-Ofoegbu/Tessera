# 02-02 — Index Engine — SUMMARY

**Status:** Complete
**Requirements:** IDX-02, IDX-03

## What shipped

- `src/core/indexEngine.ts` — pure, deterministic, versioned:
  - `vwap(points)` = `Σ(usdCents·n)/Σ n` (volume-weighted price).
  - `buildIndex(input): Metric<IndexResult>` — base period = earliest point with `n ≥ MIN_POINT_SAMPLE`; `base ≡ 100`; each point `value = round2(100·usdCents/basePrice)` when `n ≥ MIN_POINT_SAMPLE`, else **`null` (a gap)** — never interpolated (IDX-03); `current` = last non-null value. Thin series / no valid base / basePrice ≤ 0 → `insufficient`. Stamped with `INDEX_ENGINE_VERSION`.
  - Reproducible by hand: `value_t = 100 · price_t / price_base` (IDX-02).

## Verification

- `pnpm exec tsc` → 0; `pnpm exec vitest run src/core` → all pass (5 index assertions).
- Worked example pinned: series `[200000,210000,240000,220000,260000]` (n=4) → `[100, 105, 120, 110, 130]`, base 100, current 130, version `index@1.0.0`.
- Asserts: base=100, hand-reproduction, an `n=1` point → `null` gap (not interpolated), thin series → insufficient, determinism, vwap n-weighting (`(100·1+200·3)/4 = 175`).

## Notes

- Index consumes a normalized `PricePoint[]` series (same shape from Mock or Renaiss). Wired to categories + served in Phase 3. The reproducible VWAP→100 index backs the demo's "verify by hand" methodology and safety story.
