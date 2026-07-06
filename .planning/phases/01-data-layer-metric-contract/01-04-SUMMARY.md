# 01-04 — Real Renaiss Adapter + Wiring — SUMMARY

**Status:** Complete
**Requirements:** DATA-02

## What shipped

- `src/data/renaiss/client.ts` — credential-optional HTTP client for `https://api.renaissos.com`: fixed allowlisted base URL (no SSRF), optional `X-Api-Key`/`X-Api-Secret` from env, 8s AbortController timeout, `429`/`Retry-After` → `RateLimitError`, in-memory TTL cache (5 min).
- `src/data/renaiss/map.ts` — PURE mappers (no I/O; `now` injected for deterministic freshness): `mapIndexTileToCategory`, `mapConstituent`, `mapTradeToSale`, `mapSeriesPoint`, `mapProvenance`. USD cents → `Money`; API `confidence`/`updatedAt`/`constituentCount` → provenance. Insufficient rule mirrors RENAISS-API.md: `sampleSize < MIN_SAMPLE` OR `staleDays > MAX_STALE_DAYS` OR sparse sparkline (the freshness arm the plan-checker flagged is included). A `null` `priceUsdCents` → `insufficient`, never a fabricated 0.
- `src/data/renaiss/RenaissSource.ts` — implements the DataSource port over `/v1/indices`, `/v1/indices/{game}`, `/v1/trades/recent`, `/v1/health`. Degrades gracefully (empty list / insufficient) on rate-limit or network error so a live demo is never blocked.
- `src/data/renaiss/fixtures/indices.sample.json` — hand-authored, schema-accurate sample used to unit-test the mappers with **no live call**.
- `src/data/getDataSource.ts` — the SINGLE wiring point: `MockSource` by default, `RenaissSource` when `USE_RENAISS=1` or partner creds are present. (DATA-02)

## Verification

- `pnpm exec tsc` → 0; `pnpm exec vitest run` → **25 tests pass** (6 new); `pnpm build` → 0.
- Mapper tests (fixed `NOW`, no network): healthy tile → ok Category w/ `source:'renaiss'`, `confidence:'high'`; thin tile → insufficient; CategoryDetail schema-valid with a null-price card → insufficient; trades → schema-valid Sales.
- Wiring tests: `getDataSource()` → `MockSource` by default, `RenaissSource` when `USE_RENAISS=1`.

## Notes / follow-ups

- `getRecentSales(id)` currently returns the cross-card `/v1/trades/recent` feed; per-category filtering (via card `/trades`) is a Phase 3 refinement.
- `api.renaissos.com` reachability from the build sandbox was intermittent; the adapter is coded to the documented contract and proven against the captured fixture. First real call happens from the deploy environment (Phase 6) — set `USE_RENAISS=1` (+ optional creds) there.
- The freshness/stale arm uses `MAX_STALE_DAYS` (placeholder 30) — finalized in Phase 2.
