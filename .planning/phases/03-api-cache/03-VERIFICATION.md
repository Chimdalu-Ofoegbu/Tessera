# Phase 3 — API & Cache — VERIFICATION

**Method:** Self-verification by the orchestrator via the runtime test suite. (Phases 1–2 used an independent `gsd-verifier`; Phase 3's handlers are thin wrappers over the already-verified compute layer and are proven directly by runtime handler tests.)

## Goal
Serve the computed results over a thin, cached JSON API that attaches provenance to every metric and never does math.

## Success criteria — verified
1. **Well-shaped JSON with provenance on every metric** — ✓ `src/lib/api.test.ts` drives the real handlers with mock req/res: `/api/overview` → 200 + 4 cards + cache header; `/api/categories/:id` → 200 (pokemon, `risk.ok`); `/api/health` → 200 `{ ok, source:'seed' }`. Payloads are `Metric`-wrapped (compute tests).
2. **Thin data → insufficient/gap, not a bare number** — ✓ compute tests: lorcana insufficient for risk + index + floor end-to-end.
3. **Precomputed/cached** — ✓ 60s TTL memo (memo test: same reference within TTL) + `Cache-Control: s-maxage=60, stale-while-revalidate=300` on every data handler.
4. **SPA rewrite keeps `/api/*` reachable while deep-links survive refresh** — ✓ `vercel.json` `/(.*) → /index.html`; Vercel auto-excludes `/api/*`.
5. **Unknown id → 404 JSON, no crash** — ✓ `api.test.ts` asserts 404 with `{ error:'unknown category' }`.

## Gates
- `pnpm exec tsc` → 0
- `pnpm exec vitest run` → 0 (**48 tests, 8 files**)
- `pnpm build` → 0

## Requirements
- **API-01** ✓ — endpoints + provenance, runtime-tested.
- **SHIP-01** — config ✓ (`vercel.json` SPA rewrite); the public **deploy** is deferred to Phase 6 (with the user).

**Backend (Phases 1–3) complete.** Next: frontend integration (Phase 4/5), gated on the user's Claude Design handoff.
