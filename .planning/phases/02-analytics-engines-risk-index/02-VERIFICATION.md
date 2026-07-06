---
phase: 02-analytics-engines-risk-index
verified: 2026-07-06T03:00:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
re_verification:
  # None — initial verification
requirements_verified: [IDX-02, IDX-03, RISK-03, RISK-05]
commands:
  - cmd: "pnpm exec tsc"
    exit: 0
  - cmd: "pnpm exec vitest run"
    exit: 0
    detail: "6 files, 38 tests passed (13 in src/core)"
  - cmd: "pnpm build"
    exit: 0
    detail: "tsc && vite build — built in 385ms"
notes:
  - "DOC (info, not a gap): METHODOLOGY worked example overstates HHI for constituents [900000,60000,45000,30000] as 0.806 (C 74.1, score 47). Correct value is HHI 0.762 → C 68.30 → score 45. The CODE implements the documented formula (Sigma share^2) correctly; only the doc's illustrative arithmetic is off. The doc labels this example 'illustrative of the mechanics' and defers to the test fixtures. The ROADMAP-named hand-check (index [200000,210000,240000]->[100,105,120]) reproduces exactly."
---

# Phase 2: Analytics Engines (Risk + Index) — Verification Report

**Phase Goal:** Compute the risk score and price index as pure, deterministic, versioned functions whose outputs are reproducible, explainable, and honest under thin data.

**Verified:** 2026-07-06
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running the risk engine twice on identical inputs yields an identical score; result carries an engine version tag | VERIFIED | `computeRisk` is a pure fn: no `Date.now`/`Math.random`/`new Date()` in engine math (grep: 0 matches); `now` injected via `RiskInput.now`. Result stamps `version: RISK_ENGINE_VERSION` (`risk.ts:122`). Determinism test passes (deep-equal). Independent verifier check: two runs `.toEqual`, version `risk@1.0.0`. |
| 2 | The four risk factors reconcile to the headline score (math + a test asserts it) | VERIFIED | `score = clamp(round(Σ four contributions))` (`risk.ts:113-120`); each factor returns `{raw, weight, contribution=weight·raw}`. Test "factor contributions reconcile to the headline score" asserts `Math.round(Σ contribution) === score` (`risk.test.ts:40-52`) — passes. Independent re-sum of live factors matched the headline. |
| 3 | Index is a reproducible VWAP rebased so base reads exactly 100 — hand-verifiable for one category ([200000,210000,240000]→[100,105,120]) | VERIFIED | `buildIndex` base = earliest point with `n≥MIN_POINT_SAMPLE`, `value=round2(100·usdCents/basePrice)` (`indexEngine.ts:53-59`), `base:100`. Test asserts `points[0]=100, [1]=105, [2]=120, current, version` (`indexEngine.test.ts:31-42`). **Independent verifier recompute of the ACTUAL code returned `[100,105,120]`, base 100, basePrice 200000** — exact match. |
| 4 | A category/period below the sample threshold returns INSUFFICIENT_DATA / explicit gap rather than a fabricated number — proven by a covered test | VERIFIED | Risk: guard FIRST returns `insufficient(prov)` when `series.length<MIN_SAMPLE` OR `totalObs<MIN_SAMPLE` OR (`low`&&`sampleSize<MIN_SAMPLE`) (`risk.ts:95-97`); tests "thin series → insufficient" and "low confidence + tiny sample → insufficient" pass. Index: `insufficient(prov)` when `<MIN_SAMPLE` / no valid base / basePrice≤0 (`indexEngine.ts:49-51`); thin-period points render `null` gap, never interpolated (`indexEngine.ts:57`); tests "thin series → insufficient" and "explicit gap (null)…never interpolated" pass. |

**Score:** 4/4 truths verified

### Independent Methodology Conformance (CRITICAL check — code vs METHODOLOGY.md)

Every documented formula/constant was checked against the actual implementation:

| Methodology item | Documented | In code | Match |
|------------------|-----------|---------|-------|
| Factor weights | 0.30 / 0.30 / 0.25 / 0.15 | `WEIGHTS = {liquidity:0.3, volatility:0.3, concentration:0.25, dataConfidence:0.15}` (`risk.ts:15`) | ✓ |
| Liquidity | `100·(1−min(totalObs,40)/40)`, TARGET_OBS=40 | `risk.ts:48-50`, `TARGET_OBS=40` (`risk.ts:13`) | ✓ |
| Volatility | `100·min(CoV,0.40)/0.40`, CoV=stdev/mean | `risk.ts:53-60`, `COV_CAP=0.4` (`risk.ts:14`); population variance | ✓ |
| Concentration | `N>1: 100·(HHI−1/N)/(1−1/N)`; `N≤1: 100`; HHI=Σshare² | `risk.ts:63-71` | ✓ (formula) |
| Data confidence | base(10/40/75) + sparse(25/10/0) + stale(20/8/0) | `risk.ts:74-79` | ✓ |
| Band | BASE_BAND=6; confMult(0/0.5/1.2)+sparse(1/0.4/0)+stale(0.5) | `risk.ts:81-87` | ✓ |
| Risk INSUFFICIENT rule | `len<MIN_SAMPLE ∨ totalObs<MIN_SAMPLE ∨ (low ∧ sampleSize<MIN_SAMPLE)` | `risk.ts:95` | ✓ |
| MIN_POINT_SAMPLE gap rule | 2 | `thresholds.ts:16`, used `indexEngine.ts:46,57` | ✓ |
| Index base period | earliest point with `n≥MIN_POINT_SAMPLE`; base≡100 | `indexEngine.ts:46,53,63` | ✓ |
| Index INSUFFICIENT rule | `len<MIN_SAMPLE ∨ no base ∨ basePrice≤0` | `indexEngine.ts:49` | ✓ |
| VWAP | `Σ(usdCents·n)/Σn` (0 when Σn=0) | `indexEngine.ts:34-39` | ✓ |
| Versions | `risk@1.0.0`, `index@1.0.0` | `thresholds.ts:22,25` | ✓ |

**One documentation discrepancy (INFO — not a code gap):** METHODOLOGY's *worked example* states HHI ≈ 0.806 → C ≈ 74.1 → score 47 for constituents `[900000,60000,45000,30000]`. Independent hand-calc (and the actual code) give HHI = 0.762 → C = 68.30 → score 45. The **code implements the documented HHI formula (`Σ share²`) correctly**; the doc's illustrative arithmetic overstated the intermediate. The doc explicitly labels the example "illustrative of the mechanics" and defers exact values to the test fixtures, which are internally consistent and pass. No formula or constant in code deviates from the methodology contract.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/core/thresholds.ts` | MIN_POINT_SAMPLE=2, RISK/INDEX_ENGINE_VERSION | ✓ VERIFIED | All three added; `MIN_SAMPLE=5`, `MAX_STALE_DAYS=30` retained. Pure, no imports. Already consumed by Phase-1 data layer. |
| `src/core/risk.ts` | computeRisk + 4 factor fns per METHODOLOGY; returns Metric<RiskBreakdown>; contains RISK_ENGINE_VERSION | ✓ VERIFIED | `computeRisk` + `liquidityRisk`/`volatilityRisk`/`concentrationRisk`/`dataConfidenceRisk` all exported; version stamped into result; no wall-clock. |
| `src/core/risk.test.ts` | determinism, reconciliation, factor ordering, insufficiency, version, NaN-safety | ✓ VERIFIED | 8 tests, all pass; asserts reconciliation, both insufficient paths, finite [0,100] factors, version, monotonicity. |
| `src/core/indexEngine.ts` | vwap + buildIndex per METHODOLOGY; returns Metric<IndexResult>; contains INDEX_ENGINE_VERSION | ✓ VERIFIED | Both exported; base=100, gap=null (no interpolation), insufficiency guard, version stamped. |
| `src/core/indexEngine.test.ts` | base=100, hand-reproduction, gap, insufficiency, determinism, vwap | ✓ VERIFIED | 5 tests, all pass; hand-reproduction `[100,105,120]…130`, `null` gap, thin→insufficient, vwap n-weighting=175. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `risk.ts` | `thresholds.ts` | import MIN_SAMPLE, MAX_STALE_DAYS, RISK_ENGINE_VERSION | WIRED | `risk.ts:10`; version used at `risk.ts:122` |
| `indexEngine.ts` | `thresholds.ts` | import MIN_SAMPLE, MIN_POINT_SAMPLE, INDEX_ENGINE_VERSION | WIRED | `indexEngine.ts:9`; version used at `indexEngine.ts:63` |
| both engines | `src/data/metric.ts` | import ok/insufficient/Metric/Provenance | WIRED | Insufficient branch returns first-class `Metric` insufficiency; type contract enforced by `tsc` (exit 0) |
| both engines | `src/data/schema.ts` | import PricePoint (input series shape) | WIRED | `PricePoint` shape (t/usdCents/n/kind/source/bucket) matches engine + test usage |
| engines → app caller | (Phase 3) | — | DEFERRED (not a gap) | ROADMAP scopes Phase 2 as pure engines; SUMMARYs state wiring to categories/API is Phase 3. Engines exercised by comprehensive test suites, not yet a runtime caller — correct for this phase. |

### Behavioral Spot-Checks

| Behavior | Command / Method | Result | Status |
|----------|------------------|--------|--------|
| Index reproduces documented example in real code | vitest import of `buildIndex` on `[200000,210000,240000,…]` | `[100,105,120]`, base 100, basePrice 200000 | ✓ PASS |
| Risk determinism + reconciliation in real code | vitest import: two `computeRisk` runs + re-sum contributions | runs `.toEqual`; `round(Σ contribution)===score`; version `risk@1.0.0` | ✓ PASS |
| VWAP n-weighting | `vwap([100·1, 200·3])` | 175 | ✓ PASS |
| Thin case → insufficient (both engines) | vitest thin-series inputs | `ok===false` for risk and index | ✓ PASS |
| Type check | `pnpm exec tsc` | exit 0 | ✓ PASS |
| Full test suite | `pnpm exec vitest run` | 38/38 pass, exit 0 | ✓ PASS |
| Production build | `pnpm build` (`tsc && vite build`) | exit 0, built 385ms | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| IDX-02 | 02-02 | Deterministic, reproducible VWAP index | ✓ SATISFIED | `buildIndex` pure/versioned; base=100; `value_t=100·price_t/price_base`; hand-reproduction verified in actual code |
| IDX-03 | 02-02 | Explicit gaps / insufficient for thin periods, no interpolation | ✓ SATISFIED | Thin point → `null` (never interpolated); thin series / no base → `insufficient`; covered tests pass |
| RISK-03 | 02-01 | Deterministic + versioned risk score with version tag | ✓ SATISFIED | Pure fn, `now` injected, no clock in math; `version: risk@1.0.0` stamped; determinism test + independent two-run check pass |
| RISK-05 | 02-01 | Thin data → insufficient, not a fabricated score | ✓ SATISFIED | Insufficient guard FIRST (three conditions); two covered tests (thin series; low-conf+tiny-sample) pass |

No orphaned requirements: REQUIREMENTS.md maps exactly IDX-02/IDX-03/RISK-03/RISK-05 to Phase 2, all claimed by plans 02-01/02-02.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/core/thresholds.ts` | 5 | Comment word "placeholders…finalized in Phase 2" | ℹ️ Info | Stale comment only — the thresholds ARE now finalized (MIN_POINT_SAMPLE + engine versions added). No code impact. |

No `TODO`/`FIXME`/`return null` stubs / empty handlers / `console.log` / `not implemented` in production files. The `value: … : null` in `indexEngine.ts:57` is the intended IDX-03 gap sentinel, not a stub. No wall-clock or randomness in engine math. No duplicate/conflicting constant definitions (single source of truth).

### Human Verification Required

None. This is a headless pure-compute phase with no visual, real-time, or external-service surface. Every branch (both engines, all four factors, both insufficiency paths, gap rendering, determinism, versioning, VWAP) is exercised by the passing test suites and independently re-derived by hand.

### Gaps Summary

No gaps. All four ROADMAP success criteria are TRUE in the actual code (not merely claimed), verified by independent recomputation of the engine functions — not by trusting SUMMARY.md. The one discrepancy found is a minor arithmetic imprecision in METHODOLOGY's explicitly-illustrative worked example (HHI 0.806 vs correct 0.762); the code implements the documented formula correctly and the ROADMAP-named hand-check (`[200000,210000,240000]→[100,105,120]`) reproduces exactly. `tsc`, `vitest run` (38/38), and `build` all exit 0.

**Optional follow-up (non-blocking):** correct METHODOLOGY.md's worked-example numbers (HHI 0.762, C 68.30, score 45) and refresh the stale "placeholders" comment in `thresholds.ts` so the docs match the honest, correct implementation.

---

_Verified: 2026-07-06_
_Verifier: Claude (gsd-verifier)_
