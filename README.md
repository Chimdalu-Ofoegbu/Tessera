# Tessera

A "Bloomberg terminal lite" for real-world collectibles on the Renaiss ecosystem — graded trading cards (Pokémon, One Piece, Sports). Tessera reads the **Renaiss Index** for price and adds the one thing Renaiss doesn't: a transparent, confidence-banded **risk score**.

> **Renaiss gives you the price; Tessera adds the risk lens.**

Every number carries its **source + freshness timestamp + confidence**, the risk score always shows its factor breakdown (no black box), and thin data renders an honest **"insufficient data"** state instead of a fabricated number.

## Public JSON API

Base: your deployment URL (e.g. `https://tessera.vercel.app`). All responses are JSON; **every metric is wrapped in a provenance envelope** and can be `insufficient`:

```jsonc
// a "metric" is never a bare number:
{ "ok": true, "value": 122.4, "provenance": { "source": "renaiss", "asOf": "2026-07-01T00:00:00.000Z", "confidence": "high", "sampleSize": 42 } }
// or, when data is thin:
{ "ok": false, "insufficient": true, "provenance": { "source": "seed", "asOf": "…", "confidence": "low", "sampleSize": 2 } }
```

| Endpoint | Returns |
|----------|---------|
| `GET /api/overview` | `{ totalListings, totalVolume, topMovers[], categories[], source, asOf }` — category cards each with index (`Metric<number>`), deltas, sparkline, and a `risk` (`Metric<RiskBreakdown>`) |
| `GET /api/categories` | `{ categories[] }` — the card list |
| `GET /api/categories/:id` | full detail: `floor` (`Metric<Money>`), `volume`, `constituents[]`, `recentSales[]`, `indexSeries` (`Metric<IndexResult>`), `risk` (`Metric<RiskBreakdown>`) |
| `GET /api/index/:id?window=7\|30\|90\|365` | `{ id, base: 100, window, indexSeries }` — VWAP index rebased to 100, with explicit `null` gaps for thin periods |
| `GET /api/health` | `{ ok, source }` — liveness + active data source |

**Risk score** (`RiskBreakdown`): a 0–100 composite of four factors — `liquidity`, `volatility`, `concentration`, `dataConfidence` — each with `{ raw, weight, contribution }` that **sum to the headline `score`**, plus a `band` (±). Methodology: [`.planning/phases/02-analytics-engines-risk-index/02-METHODOLOGY.md`](.planning/phases/02-analytics-engines-risk-index/02-METHODOLOGY.md).

## Data source

Tessera runs on clearly-labeled **seed data by default** (demo-safe, reliable) behind a `DataSource` port. To use the live **Renaiss Index API** (`https://api.renaissos.com/v1`), set `USE_RENAISS=1` (optionally `RENAISS_API_KEY` / `RENAISS_API_SECRET` for the partner tier). The swap is one wiring point; nothing else changes. Data attribution: the Renaiss Index API.

## Stack

Vite + React 19 + TypeScript · zod (single schema source) · Vitest · TanStack Query · Vercel serverless (`/api`).

## Run locally

```bash
pnpm install
pnpm dev          # SPA at http://localhost:5173
vercel dev        # SPA + /api serverless functions together
pnpm test         # unit tests (data layer, engines, compute)
pnpm build        # production build
```

_No wallet, no login, no trading — read-only market intelligence. Derived numbers are scored signals with confidence bands, never verified valuations._
