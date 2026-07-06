# Tessera Analytics Methodology (v1)

Resolves the three open Phase-2 decisions (risk factor weights, thin-data thresholds, index base period). Everything here is **deterministic** (pure functions of the inputs — no randomness, no wall-clock inside the math; `now` is injected), **versioned**, and **explainable** (every factor reconciles to the headline). This document is the "no black box" contract; the engines implement it exactly and unit tests pin it.

## Shared thresholds (`src/core/thresholds.ts`)

| Constant | v1 value | Meaning |
|----------|----------|---------|
| `MIN_SAMPLE` | 5 | Minimum observations for any metric to be "sufficient" |
| `MAX_STALE_DAYS` | 30 | Freshness ceiling before data is "stale" |
| `MIN_POINT_SAMPLE` | 2 | Minimum sales (`n`) at a series point before it counts (else a gap) |
| `RISK_ENGINE_VERSION` | `risk@1.0.0` | Stamped on every risk result |
| `INDEX_ENGINE_VERSION` | `index@1.0.0` | Stamped on every index result |

## Risk score (0–100, higher = riskier)

A weighted composite of four transparent factors, each normalized to `[0,100]`. **The four weighted contributions sum exactly to the headline score** — this is the reconciliation guarantee.

| Factor | Weight | Signal | Normalization (→ [0,100] risk) |
|--------|--------|--------|--------------------------------|
| **Liquidity** | 0.30 | total observed sales `totalObs = Σ n` over the series | `100 · (1 − min(totalObs, TARGET_OBS)/TARGET_OBS)`, `TARGET_OBS = 40` (fewer trades → higher risk) |
| **Volatility** | 0.30 | coefficient of variation `CoV = stdev/mean` of series `usdCents` | `100 · min(CoV, COV_CAP)/COV_CAP`, `COV_CAP = 0.40` |
| **Concentration** | 0.25 | Herfindahl index `HHI = Σ share²` of constituent values | `N>1: 100 · (HHI − 1/N)/(1 − 1/N)`; `N≤1: 100` |
| **Data confidence** | 0.15 | confidence tier + sample + freshness | `base(conf) + sparsePenalty + stalePenalty`, clamped — see below |

- `base(confidence)`: high → 10, medium → 40, low → 75.
- `sparsePenalty`: `sampleSize < MIN_SAMPLE` → 25; `< 15` → 10; else 0.
- `stalePenalty`: `staleDays > MAX_STALE_DAYS` → 20; `> 14` → 8; else 0. (`staleDays` from injected `now` − `asOf`.)

**Composite:** `score = round(0.30·L + 0.30·V + 0.25·C + 0.15·D)`.
**Breakdown returned:** for each factor `{ raw, weight, contribution = weight·raw }`; `Σ contribution ≈ score` (± rounding). The UI (Phase 5) renders exactly this.

**Confidence band (±):** `band = round(BASE_BAND · mult)`, `BASE_BAND = 6`,
`mult = 1 + conf(high 0 | medium 0.5 | low 1.2) + (sampleSize<MIN_SAMPLE ? 1 : sampleSize<15 ? 0.4 : 0) + (staleDays>MAX_STALE_DAYS ? 0.5 : 0)`.
→ high-confidence/deep sample ≈ ±6; low-confidence/thin ≈ ±20. The band **widens as data thins/ages** (RISK-04 display uses this).

**INSUFFICIENT_DATA (RISK-05):** return the `insufficient` metric branch (no fabricated score) when `series.length < MIN_SAMPLE` OR `totalObs < MIN_SAMPLE` OR (`confidence === 'low'` AND `sampleSize < MIN_SAMPLE`).

**Determinism/versioning (RISK-03):** pure function; identical inputs → identical `{ score, factors, band }`; result carries `RISK_ENGINE_VERSION`.

## Category index (base = 100)

Volume-weighted average price rebased to 100 at a base period, reproducible by hand.

- **VWAP helper:** `vwap(points) = Σ(usdCentsᵢ · nᵢ) / Σ nᵢ` — the volume-weighted price (underlying Renaiss FMV is already VWAP; ours inherits it).
- **Base period:** the **earliest** series point whose `n ≥ MIN_POINT_SAMPLE`. `basePrice = that point's usdCents`. Base index ≡ 100.
- **Index series (IDX-02):** for each point `t`, `value_t = round2(100 · usdCents_t / basePrice)` when `n_t ≥ MIN_POINT_SAMPLE`, else **`null` (a gap)** — never interpolated (IDX-03). "Verify by hand" = `100 · price_t / price_base`.
- **Current level:** the last non-null `value`.
- **INSUFFICIENT_DATA (IDX-03):** return `insufficient` when `series.length < MIN_SAMPLE`, or no point reaches `MIN_POINT_SAMPLE`, or `basePrice ≤ 0`.
- **Determinism/versioning:** pure; carries `INDEX_ENGINE_VERSION`.

## Worked example (pins the tests)

Series `usdCents = [200000, 210000, 240000]`, all `n = 4`, `confidence = high`, `sampleSize = 40`, fresh:
- Index: base = 200000 → values `[100.00, 105.00, 120.00]`, current = 120.00. (No gaps; `n=4 ≥ 2`.)
- Liquidity: totalObs = 12 → `L = 100·(1 − 12/40) = 70`.
- Volatility: mean ≈ 216667, stdev ≈ 16997, CoV ≈ 0.0784 → `V = 100·0.0784/0.40 ≈ 19.6`.
- With constituents `[900000, 60000, 45000, 30000]` (concentrated): total 1,035,000, shares² sum → HHI ≈ 0.7623, N=4 → `C = 100·(0.7623 − 0.25)/0.75 ≈ 68.30`.
- Data: high(10) + sparse(0, sampleSize 40) + stale(0) → `D = 10`.
- Score = round(0.30·70 + 0.30·19.61 + 0.25·68.30 + 0.15·10) = round(21 + 5.88 + 17.08 + 1.5) = round(45.46) = **45**. Band: high, deep, fresh → ±6.
  *(Verified against the actual `computeRisk`/`buildIndex` code — the engine tests are the source of truth.)*

*(Exact test fixtures live in the engine test files; this example is illustrative of the mechanics.)*

## Rationale (why this is defensible, not a black box)

- Additive weighted factors that visibly reconcile = the XAI-in-finance norm (show which signals drove the score); no ML, no opaque weighting (PITFALLS.md).
- HHI is the standard market-concentration measure; CoV is the standard dispersion measure; VWAP + base-100 rebasing is standard index construction (BLS/IMF-style), guarded against base-period drift by requiring `n ≥ MIN_POINT_SAMPLE` at the base.
- Thin/stale/low-confidence data widens the band and, past thresholds, returns `INSUFFICIENT_DATA` — the safety rule, enforced by the same envelope the data layer uses.
