# 02-01 — Risk Engine — SUMMARY

**Status:** Complete
**Requirements:** RISK-03, RISK-05

## What shipped

- `src/core/thresholds.ts` — added `MIN_POINT_SAMPLE=2`, `RISK_ENGINE_VERSION='risk@1.0.0'`, `INDEX_ENGINE_VERSION='index@1.0.0'`.
- `src/core/risk.ts` — pure, deterministic `computeRisk(input): Metric<RiskBreakdown>` implementing 02-METHODOLOGY.md exactly:
  - Factors (each exported + individually tested): `liquidityRisk` (TARGET_OBS=40), `volatilityRisk` (CoV, COV_CAP=0.40), `concentrationRisk` (HHI-normalized), `dataConfidenceRisk` (base + sparse + stale penalties).
  - Weights 0.30/0.30/0.25/0.15; `contribution = weight·raw`; `score = round(Σ contribution)` — **contributions reconcile to the headline** (tested).
  - Confidence `band` widens as data thins/ages.
  - Insufficient guard first (RISK-05): thin series / low totalObs / low-confidence+tiny-sample → `insufficient`, no fabricated score.
  - Degenerate inputs guarded (no NaN/Infinity); stamped with `RISK_ENGINE_VERSION`.

## Verification

- `pnpm exec tsc` → 0; `pnpm exec vitest run src/core` → all pass (8 risk assertions).
- Asserts: determinism (deep-equal), reconciliation (`Math.round(Σ contribution) === score`), concentration/volatility factor ordering, thin → insufficient, low-conf+tiny-sample → insufficient, version `risk@1.0.0`, finite factors in [0,100], monotonic liquidity/data penalties.

## Notes

- `computeRisk` is pure (no I/O, no clock); `now` is injected so freshness is deterministic. Wired to real category inputs in Phase 3.
- `src/core` imports the pure `Metric`/`ok`/`insufficient` constructors + types from `src/data` (type + pure-constructor only — no runtime coupling to sources/fixtures).
