# 03-02 — Vercel /api Handlers + Public API Docs — SUMMARY

**Status:** Complete
**Requirements:** API-01, SHIP-01 (config portion; deploy in Phase 6)

## What shipped

Thin `@vercel/node` handlers (`export default handler(req, res)`) over the compute layer — no math in the handlers:

| File | Route | Returns |
|------|-------|---------|
| `api/overview.ts` | `GET /api/overview` | overview payload (totals, movers, cards) |
| `api/categories.ts` | `GET /api/categories` | `{ categories[] }` |
| `api/categories/[id].ts` | `GET /api/categories/:id` | full detail; **404 JSON** on unknown id |
| `api/index/[id].ts` | `GET /api/index/:id?window=` | `{ id, base, window, indexSeries }`; 404 on unknown id |
| `api/health.ts` | `GET /api/health` | `{ ok, source }` |

- Every handler sets `Cache-Control` (`s-maxage=60, stale-while-revalidate=300`; health `no-store`) and `content-type: application/json`, wrapped in try/catch.
- `tsconfig.json` `include` now covers `api/`.
- `README.md` documents the public JSON API (endpoints + the provenance-envelope shape + `USE_RENAISS` toggle + Renaiss data attribution + local run).

## Verification

- `pnpm exec tsc` → 0 (api/ typechecked); `pnpm build` → 0; full suite **48 tests pass**.
- `src/lib/api.test.ts` drives the real handlers with a mock req/res: `/api/overview` → 200 + 4 cards + cache header; `/api/categories/:id` → 200 (pokemon, risk.ok) and **404** (unknown id); `/api/health` → 200 `{ ok:true, source:'seed' }`.

## Notes

- SPA-safe routing (SHIP-01 config): `vercel.json` rewrites `/(.*) → /index.html`; Vercel auto-excludes `/api/*`, so functions resolve while deep-links survive refresh. The actual public **deploy** is Phase 6 (with the user: Vercel auth + optional Renaiss creds); live endpoints are exercised there via `vercel dev` / the deployed URL.
- Handlers import the compute layer via relative paths (`../src/lib/compute`); Vercel's function bundler traces these.
