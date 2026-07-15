# Tessera

A "Bloomberg terminal lite" for real-world collectibles on the Renaiss ecosystem — graded trading cards (Pokémon, One Piece, Sports). Tessera reads the **Renaiss Index** for price and adds the one thing Renaiss doesn't: a transparent, confidence-banded **risk score**.

> **Renaiss gives you the price; Tessera adds the risk lens.**

Every number carries its **source + freshness timestamp + confidence**, the risk score always shows its factor breakdown (no black box), and thin data renders an honest **"insufficient data"** state instead of a fabricated number.

## Public JSON API

**Live:** https://www.tesseraindex.xyz · **API:** https://www.tesseraindex.xyz/api/overview.json (all endpoints below). All responses are JSON; **every metric is wrapped in a provenance envelope** and can be `insufficient`:

```jsonc
// a "metric" is never a bare number:
{ "ok": true, "value": 11255.69, "provenance": { "source": "renaiss", "asOf": "2026-07-07T00:00:00.000Z", "confidence": "high", "sampleSize": 50 } }
// or, when data is thin:
{ "ok": false, "insufficient": true, "provenance": { "source": "renaiss", "asOf": "…", "confidence": "low", "sampleSize": 2 } }
```

In production the API is a **static snapshot of the live Renaiss Index API, regenerated on every production build** — fetched through the `RenaissSource` adapter, scored by Tessera's engines, CDN-served for reliability (the public Renaiss tier allows 10 req/day, so per-request proxying is off the table by design). Endpoints carry a `.json` suffix. (The equivalent serverless handlers live in `api/*.ts` and serve the extension-less paths in local dev.)

| Endpoint | Returns |
|----------|---------|
| `GET /api/overview.json` | `{ totalListings, totalVolume, topMovers[], categories[], source, asOf }` — category cards each with index (`Metric<number>`), deltas, sparkline, and a `risk` (`Metric<RiskBreakdown>`) |
| `GET /api/categories.json` | `{ categories[] }` — the card list |
| `GET /api/categories/{id}.json` | full detail: `floor` (`Metric<Money>`), `volume`, `constituents[]`, `recentSales[]`, `indexSeries` (`Metric<IndexResult>`), `risk` (`Metric<RiskBreakdown>`) |
| `GET /api/index/{id}.json` | `{ id, base: 100, indexSeries }` — VWAP index rebased to 100, with explicit `null` gaps for thin periods |
| `GET /api/health.json` | `{ ok, source }` — liveness + active data source |

Category ids: the games the live Renaiss Index publishes — currently `pokemon` and `one-piece` (the set expands automatically when Renaiss lists more; regenerating the snapshot picks them up). Any tile that is thin, stale, or short-series renders `insufficient` rather than a fabricated value.

**Risk score** (`RiskBreakdown`): a 0–100 composite of four factors — `liquidity`, `volatility`, `concentration`, `dataConfidence` — each with `{ raw, weight, contribution }` that **sum to the headline `score`**, plus a `band` (±). Methodology: [`.planning/phases/02-analytics-engines-risk-index/02-METHODOLOGY.md`](.planning/phases/02-analytics-engines-risk-index/02-METHODOLOGY.md).

## Data source

**Production runs on live Renaiss Index data** (`https://api.renaissos.com/v1`), pulled through the `RenaissSource` adapter and shipped as the static snapshot above — every metric carries `source: "renaiss"`. Local dev and tests default to clearly-labeled seed fixtures (`MockSource`) behind the same `DataSource` port; set `USE_RENAISS=1` (optionally `RENAISS_API_KEY` / `RENAISS_API_SECRET` for the partner tier) to point dev at the live API. The swap is one wiring point; nothing else changes. Refreshing the prod snapshot is automatic: `scripts/gen-snapshot.mjs` runs at the start of every production build (it's the first half of `pnpm build`) and rewrites `public/api/*.json` from the live API through the same compute layer the handlers use — so each deploy ships current data, never a frozen snapshot. It **fails safe**: if Renaiss is unavailable or rate-limited, the build keeps the last committed snapshot instead of failing, and only ever writes a fully-fetched, validated set (all-or-nothing). It fetches live only on Vercel production builds (`VERCEL_ENV=production`) or on demand via `pnpm gen:snapshot`; local `pnpm build` skips it, so development never spends the public tier's 10 req/day. Data attribution: the Renaiss Index API.

## Stack

Vite + React 19 + TypeScript · zod (single schema source) · Vitest · TanStack Query · Three.js (hero) · Vercel (static SPA + pre-generated JSON API).

## Run locally

```bash
pnpm install
pnpm dev          # SPA + /api served by the Vite dev middleware — http://localhost:5173
pnpm test         # unit tests (data layer, engines, compute, handlers) — 49 tests
pnpm typecheck    # tsc (separate from build)
pnpm build        # production build → dist/ (refreshes live /api on Vercel prod; skipped locally)
pnpm gen:snapshot # force-refresh public/api/*.json from the live Renaiss API (≈5 upstream calls)
```

_No wallet, no login, no trading — read-only market intelligence. Derived numbers are scored signals with confidence bands, never verified valuations._
