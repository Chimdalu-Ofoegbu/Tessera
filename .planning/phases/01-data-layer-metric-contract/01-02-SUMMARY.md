# 01-02 — Metric Envelope + Provenance + zod Schemas — SUMMARY

**Status:** Complete
**Requirements:** DATA-03, PROV-02

## What shipped

The metric contract that makes a bare/unsourced number unrepresentable, plus all normalized entity schemas as the single source of truth.

- `src/data/metric.ts` — `Metric<T>` discriminated union `{ ok:true, value, provenance } | { ok:false, insufficient:true, provenance }`; `ok()` / `insufficient()` constructors; `isOk()` guard. `Provenance` = `{ source, asOf, confidence, sampleSize }` — **this IS the envelope descriptor** DATA-03 requires (resolves plan-checker Blocker 1: the equivalence is now explicit and asserted).
- `src/core/thresholds.ts` — pure `MIN_SAMPLE=5`, `MAX_STALE_DAYS=30`, `THRESHOLDS_VERSION='thresholds@0.1.0'` (finalized in Phase 2).
- `src/data/schema.ts` — zod schemas → `z.infer` types: Game, Confidence, SourceId, Provenance, `metricSchema()`, Money, Deltas, PricePoint, Sale, Constituent, Category, CategoryDetail, Window. Field names mirror the real Renaiss API. `Category.index` and `Constituent.price` are `Metric<…>` so thin data surfaces insufficiency at the tile/row level.

## Verification

- `pnpm exec tsc` → exit 0 (includes the `@ts-expect-error` proving `ok(1)` without provenance is a type error, and a `Provenance` assignability proof).
- `pnpm exec vitest run src/data` → **12 tests pass**. Key assertions:
  - `ProvenanceSchema.parse(...)` yields exactly `{asOf, confidence, sampleSize, source}` (Blocker 1).
  - `metricSchema(z.number()).parse({ ok:true, value:100 })` **throws** (no provenance → rejected).
  - a bare number `safeParse(100).success === false`.
  - an `insufficient` metric parses (first-class).

## Notes / deviations

- Used `.int().min(0)` / `.int().min(1)` instead of `.nonnegative()` / `.positive()` for zod-v4 version-safety (equivalent).
- zod v4's `z.discriminatedUnion('ok', [...])` (key form) works in 4.4.3 — confirmed by passing tests.
- Blocker 1 (checker) resolved in-code (explicit + asserted). Blocker 2 (Collectible/Listing reconciliation) is handled in 01-03.
