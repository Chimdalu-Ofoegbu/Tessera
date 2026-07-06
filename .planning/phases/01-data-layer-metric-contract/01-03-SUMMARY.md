# 01-03 — DataSource Port + MockSource Fixtures — SUMMARY

**Status:** Complete
**Requirements:** DATA-01, PROV-02

## What shipped

- `src/data/DataSource.ts` — the port: `getCategories`, `getCategory`, `getIndexSeries`, `getRecentSales`, `getFeaturedMovers`, `health`, plus `Mover`/`Health`. Documents the entity-model reconciliation (resolves plan-checker Blocker 2): `Category`=index tile, `Constituent`=collectible/card, `Sale`=transaction|listing (`kind`), `PricePoint`=series point.
- `src/data/fixtures.ts` — deterministic seed data (no randomness, fixed `asOf` anchor `2026-07-01`) with four market shapes:
  - **pokemon** — liquid/healthy (deep sample, high confidence, smooth uptrend) → index `ok`
  - **one-piece** — momentum spike (sharp recent jump, +12.4% d7) → index `ok`
  - **sports** — concentrated (Jordan RC $9,000 dominates the rest) → index `ok`
  - **lorcana** — deliberately thin (2 points < MIN_SAMPLE, low confidence) → index **`insufficient`**
- `src/data/mock/MockSource.ts` — implements the port over fixtures; every value provenance-wrapped (`source:'seed'`); `getIndexSeries` returns `insufficient` when the window has `< MIN_SAMPLE` points or the category index is already insufficient.
- `src/data/getDataSource.ts` — the SINGLE wiring point; returns `MockSource` by default (01-04 adds the RenaissSource branch).

## Verification

- `pnpm exec tsc` → exit 0.
- `pnpm exec vitest run src/data` → **19 tests pass** (12 from 01-02 + 7 here). Asserts: 4 categories, all tiles/details schema-valid, `source:'seed'` on every metric, lorcana insufficient at tile + series, pokemon ok + 30d series ≥ 5 points, unknown id throws, movers exclude the insufficient category and sort by |d7| (one-piece first), `getDataSource().health()` = `{ok:true, source:'seed'}`.
- Boundary: no `fixtures` import outside `src/data/` (only a comment mention in `thresholds.ts`).

## Notes

- The `game` field is a loose `string` (not the 3-value enum) precisely so the mock-only `lorcana` (not a real Renaiss game) is representable; `GameSchema` remains for the real-API mapping in 01-04. RenaissSource will only ever emit the three real games — that mock/real contrast is honest and demo-worthy.
