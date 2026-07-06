---
phase: 01-data-layer-metric-contract
verified: 2026-07-06T02:20:00Z
status: passed
score: 9/9 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
gates:
  tsc: 0
  vitest: 0
  build: 0
---

# Phase 1: Data Layer & Metric Contract — Verification Report

**Phase Goal:** Establish the normalized data contract every downstream layer obeys, so a bare or unsourced number cannot exist and the mock→real swap is a one-line change.
**Verified:** 2026-07-06T02:20:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Merged from ROADMAP Success Criteria (contract) + the four PLAN frontmatter must_have sets. Deduplicated to the 9 distinct, testable truths below.

| #   | Truth                                                                                          | Status     | Evidence |
| --- | ---------------------------------------------------------------------------------------------- | ---------- | -------- |
| 1   | Fixtures load and conform to normalized shapes (Category/Constituent/Sale/PricePoint) via one `DataSource` interface | VERIFIED | `CategorySchema.parse` / `CategoryDetailSchema.parse` pass for all 4 seeds (`MockSource.test.ts`); single `DataSource` port in `DataSource.ts`; runtime spot-check returned 4 schema-valid categories |
| 2   | A value cannot exist without provenance — the TYPE SYSTEM rejects it                            | VERIFIED | `Metric<T>` union requires `provenance` on BOTH branches (`metric.ts:30-32`). Proven load-bearing: making `ok(1, prov)` valid caused `tsc` to fail with `TS2578: Unused '@ts-expect-error'` — the guarantee is real, not cosmetic |
| 3   | A value cannot be PARSED without provenance — zod `metricSchema` rejects it                     | VERIFIED | `metricSchema(z.number()).parse({ok:true,value:100})` throws; `safeParse(100).success===false` (`schema.test.ts:34-40`); `ProvenanceSchema` yields exactly the 4 descriptor fields |
| 4   | `INSUFFICIENT_DATA` is a first-class, representable outcome                                     | VERIFIED | `insufficient()` constructor + `{ok:false,insufficient:true,provenance}` branch; parses as first-class (`schema.test.ts:47`); exercised live on lorcana |
| 5   | All entity shapes derive from zod via `z.infer` (single source of truth)                        | VERIFIED | 8 `z.infer` type exports in `schema.ts:91-98`; no hand-authored duplicate types |
| 6   | Swapping `MockSource`→`RenaissSource` touches exactly ONE wiring point, no consumer change      | VERIFIED | `getDataSource()` is the sole source constructor (`getDataSource.ts:18-20`); no `App.tsx`/`main.tsx` import of any concrete source or fixtures; `fixtures` imported only inside `src/data/` |
| 7   | Seed set includes a deliberately-thin (insufficient), a momentum-spike, and a concentrated category | VERIFIED | lorcana → `insufficient` at tile+series (test + runtime); one-piece → spike (d7 +12.4, `withSpike` ×1.28); sports → concentrated (Jordan RC $9,000 dominates rank-2 $600) |
| 8   | `RenaissSource` maps the REAL documented API (RENAISS-API.md); mapping unit-tested with NO live call | VERIFIED | Base URL, `X-Api-Key`/`X-Api-Secret`, endpoints `/v1/indices`, `/v1/indices/{game}`, `/v1/trades/recent`, `/v1/health`, USD-cents→Money, and the insufficient rule (low-conf OR sampleSize<MIN_SAMPLE OR stale>MAX_STALE_DAYS) all match the doc. Tests use `indices.sample.json` + fixed `NOW`; no `fetch` invoked |
| 9   | Missing credentials degrade gracefully to MockSource; the demo is never blocked                | VERIFIED | `getDataSource()` returns `MockSource` unless `USE_RENAISS=1` or both creds present (`getDataSource.ts`); RenaissSource methods catch network/rate-limit and return empty/insufficient |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/data/metric.ts` | `Metric<T>` union + `ok`/`insufficient`/`isOk` | VERIFIED | Discriminated union; provenance mandatory on both branches; wired into schema + fixtures + both sources |
| `src/data/schema.ts` | zod schemas + `z.infer` types + `metricSchema` | VERIFIED | All entities + `metricSchema` factory; imported by DataSource, MockSource, map, both test suites |
| `src/core/thresholds.ts` | `MIN_SAMPLE`/`MAX_STALE_DAYS`, pure, no I/O | VERIFIED | Constants only; consumed by MockSource + map.ts; no imports with side effects |
| `src/data/DataSource.ts` | The port interface + Mover/Health | VERIFIED | `interface DataSource` with 6 methods; implemented by both sources |
| `src/data/mock/MockSource.ts` | Implements port over fixtures, source 'seed' | VERIFIED | `implements DataSource`; every metric `source:'seed'`; thin→insufficient |
| `src/data/fixtures.ts` | Seed data incl. thin/spike/concentrated | VERIFIED | 4 shapes, deterministic (fixed AS_OF, no `Math.random`); imported only within `src/data/` |
| `src/data/getDataSource.ts` | Single wiring point; env branch | VERIFIED | Sole constructor; MockSource default, RenaissSource on `USE_RENAISS`/creds |
| `src/data/renaiss/RenaissSource.ts` | Real adapter over `/v1/*` | VERIFIED | `implements DataSource`; graceful degradation |
| `src/data/renaiss/map.ts` | Pure mappers, USD-cents→Money, provenance | VERIFIED | No I/O, injected `now`; insufficient rule mirrors doc |
| `src/data/renaiss/client.ts` | Credential-optional HTTP client | VERIFIED | Fixed base URL (no SSRF), 8s timeout, 429/Retry-After, TTL cache, secrets env-only |
| `src/data/renaiss/fixtures/indices.sample.json` | Captured real-shaped sample for tests | VERIFIED | Valid JSON: 2 indices (healthy+thin), detail w/ null-price constituent, recent trades |
| `package.json` / `vercel.json` / `.gitignore` / `.env.example` | Scaffold + SPA rewrite + secret-safe env | VERIFIED | test script present; `/(.*)`→`/index.html`; lockfile NOT ignored; `.env.example` blank placeholders; no `rk_`/`rsk_` token in tree |

**Frontmatter path note (INFO, not a gap):** PLANs 01-03/01-04 declare the artifact path `src/data/fixtures/categories.ts` (a directory). The shipped implementation is a flat `src/data/fixtures.ts` providing the identical content (seed categories incl. thin/spike/concentrated). The supporting truth (seed data with all four shapes) is fully satisfied; only the plan's path label differs.

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `schema.ts` | `metric.ts` | `metricSchema` factory wraps value schemas | WIRED | 3 usages; `Category.index` and `Constituent.price` are `metricSchema(...)` |
| `MockSource.ts` | `DataSource.ts` | implements the interface | WIRED | `implements DataSource` |
| `RenaissSource.ts` | `DataSource.ts` | implements the interface | WIRED | `implements DataSource` |
| `getDataSource.ts` | `MockSource.ts` | factory returns MockSource by default | WIRED | `new MockSource()` default branch (proven by test) |
| `getDataSource.ts` | `RenaissSource.ts` | factory branch on `USE_RENAISS`/creds | WIRED | `new RenaissSource()`; `USE_RENAISS=1` → RenaissSource (proven by test) |
| `RenaissSource.ts` | `map.ts` | adapter delegates shape mapping to pure mappers | WIRED | imports + calls all 5 mappers |

### Data-Flow Trace (Level 4)

Data-layer phase (no rendering surface yet). Traced the source→metric flow instead of a UI render:

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `MockSource.getCategories` | `SEED_BY_ID` tiles | deterministic fixtures | Yes — 4 provenance-wrapped tiles at runtime | FLOWING |
| `MockSource.getIndexSeries('lorcana')` | filtered `series` | thin fixture (< MIN_SAMPLE) | Correctly returns `insufficient`, not a fabricated series | FLOWING (honest gap) |
| `RenaissSource` mappers | `RawIndexTile`→`Category` | captured `indices.sample.json` | Yes — healthy tile→ok, thin tile→insufficient, null-price→insufficient | FLOWING |

### Behavioral Spot-Checks

Executed the real data layer at runtime via a temporary vitest case (removed after; suite restored to 25 tests, tree unmodified). No network.

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| `pnpm exec tsc` (includes `@ts-expect-error` proof) | typecheck | exit 0 | PASS |
| `pnpm exec vitest run` | full suite | 25 passed / 4 files, exit 0 | PASS |
| `pnpm build` (`tsc && vite build`) | production build | 63 modules, `dist/` produced, exit 0 | PASS |
| `@ts-expect-error` is load-bearing | make `ok(1,prov)` valid, re-typecheck | `TS2578 Unused directive` → tsc fails | PASS (guarantee is real) |
| Runtime: getDataSource → 4 categories, all provenance-wrapped | vitest spot-check | 4 cats, every metric has `provenance.source` | PASS |
| Runtime: thin category returns insufficient | vitest spot-check | lorcana tile `ok=false`, series `ok=false` | PASS |
| Runtime: liquid category returns ok | vitest spot-check | pokemon tile `ok=true` | PASS |
| Boundary: no `fixtures` import outside `src/data/` | grep | only `src/data/` + doc-comments | PASS |
| Secrets: no `rk_`/`rsk_` token in tree | grep | only in RENAISS-API.md format doc | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| DATA-01 | 01-01, 01-03 | Normalized data layer (categories, collectibles/listings, sales, series) behind one `DataSource` interface | SATISFIED | `DataSource.ts` port + schema entities + MockSource; all schema-valid at runtime |
| DATA-02 | 01-04 | `MockSource` serves labeled seed; `RenaissSource` stub swappable at one wiring point, no UI/engine change | SATISFIED | Both sources implement the port; `getDataSource()` sole swap; no consumer coupling |
| DATA-03 | 01-02 | Every metric crosses the wire inside `{ value \| insufficient, confidence, sampleSize, source, asOf }`; API cannot emit a bare/unsourced number | SATISFIED | `Metric<T>` + `Provenance` = the envelope; type + zod both reject bare numbers (proven) |
| PROV-02 | 01-02, 01-03 | At least one category deliberately seeded thin so live "insufficient data" is demonstrable | SATISFIED | lorcana seeded thin (2 pts < MIN_SAMPLE) → `insufficient` at tile + series, live at runtime |

No orphaned requirements: REQUIREMENTS.md maps exactly DATA-01/02/03 + PROV-02 to Phase 1, all claimed by plans and all satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/App.tsx` | 2 | "Placeholder shell" comment | ℹ️ Info | Intentional per SUMMARY 01-01 deviation #1 (production UI built externally, handed off later). Not part of the Phase 1 data-layer contract; does not block any Phase 1 truth |
| `src/core/thresholds.ts` | 5 | "placeholders … finalized in Phase 2" | ℹ️ Info | Values are real (MIN_SAMPLE=5, MAX_STALE_DAYS=30) and functional now; the note flags Phase-2 tuning, not absence |
| `RenaissSource.getRecentSales` | 65 | cross-card feed; per-category filter deferred | ℹ️ Info | Documented Phase-3 refinement; returns real, schema-valid Sales today |

No 🛑 blockers and no ⚠️ warnings. No empty-return stubs feeding user output; every "empty/insufficient" return is the intended honest-gap behavior, not a placeholder.

### Human Verification Required

None. This is a pure data/type-contract phase with no visual, real-time, or external-service surface. The one external dependency (live `api.renaissos.com`) is intentionally NOT exercised in Phase 1 — the adapter is verified against the captured fixture and the documented contract; the first real call is deferred to the deploy environment (Phase 6), which is the correct place and already noted in SUMMARY 01-04.

### Gaps Summary

No gaps. All four Phase 1 ROADMAP success criteria and all nine merged must-have truths are true in the code, not merely claimed:

- The metric envelope makes a bare/unsourced number **unrepresentable** at both compile time (proven load-bearing via the `TS2578` result when the `@ts-expect-error` was neutralized) and parse time (zod rejects it).
- The mock→real swap is genuinely one line: `getDataSource()` is the only place a source is constructed, no consumer imports a concrete source or the fixtures, and the boundary grep is clean.
- The seed set exercises every downstream branch: a liquid category, a momentum spike, a concentrated market, and a deliberately-thin category that returns `INSUFFICIENT_DATA` live at both tile and series level.
- The Renaiss adapter maps the real documented API (verified field-by-field against RENAISS-API.md) and its tests require no network.
- All three gates — `pnpm exec tsc`, `pnpm exec vitest run` (25/25), `pnpm build` — exit 0.

The only deviations are cosmetic/deferred (a plan-frontmatter path label `fixtures/categories.ts` vs the shipped `fixtures.ts`; App.tsx placeholder; Phase-3 per-category trade filtering) and none affect a Phase 1 truth.

---

_Verified: 2026-07-06T02:20:00Z_
_Verifier: Claude (gsd-verifier)_
