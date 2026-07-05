# Renaiss Index API — Integration Intel

**Source:** https://index.renaissos.com/api-docs · spec at `https://api.renaissos.com/v1/openapi.json` (OpenAPI 3.0.3)
**Captured:** 2026-07-05
**Status:** Authoritative for planning. `api.renaissos.com` had one transient DNS failure from the build environment — treat live reachability as environment-dependent; the `MockSource` fallback is mandatory regardless.

## Strategic implication (read first)

The Renaiss API **already computes the price index** (game-level tiles with value, base, deltas, sparkline, top movers, ranked constituents) and exposes per-card series/trades/FMV with **confidence and freshness built in**. It does **NOT** expose a **risk score**.

→ **Tessera's contribution is the transparent, composite RISK lens on top of real Renaiss data.** We consume real indices/series/trades (attributed to Renaiss), and compute + explain a versioned risk score (Liquidity / Volatility / Concentration / Data-confidence) that Renaiss does not provide. The API's own `confidence` / `sourceCount` / `updatedAt` fields drive our provenance chips, confidence bands, and the "insufficient data" safety state.

This strengthens all five judging criteria: **Ecosystem relevance** (real Renaiss data), **Innovation** (a risk-scored index Renaiss doesn't offer), **Clarity/Safety** (provenance + confidence come straight from the source), **Usability** (one readable view).

## Access

- **Base URL:** `https://api.renaissos.com`
- **Auth (optional, for higher limits):** headers `X-Api-Key` (`rk_…`) + `X-Api-Secret` (`rsk_…`).
- **Rate limits:** Anonymous **10 req/day per IP**; API-key partner **10,000 req/day**; Renaiss's own site unlimited.
- **Errors:** `ApiError { error, detail? }`; statuses 400/404/422/429 (`Retry-After`)/500.
- **Consequence:** never call per user-request. Backend fetches server-side, **precomputes + caches** a snapshot at boot / periodic refresh. Public tier is enough to seed a cached snapshot; a partner key (env vars `RENAISS_API_KEY` / `RENAISS_API_SECRET`) enables live-ish refresh. `MockSource` remains the default for demo reliability, tests, and the deliberately-thin safety category.

## Endpoints Tessera uses (★ = core)

| Endpoint | Gives Tessera |
|----------|---------------|
| ★ `GET /v1/indices` | Category tiles (games: pokemon, one-piece, sports) → overview KPIs, per-category index level (`value`, `base`), deltas, `sparkline[]`, `topMovers[]`, `constituentCount`, `updatedAt` |
| ★ `GET /v1/indices/{game}` | Category detail → `IndexDetail` with ranked `constituents[]` (for Concentration factor + detail view) |
| ★ `GET /v1/cards/{game}/{set}/{card}/series?window=7\|30\|90\|365` | Time-series `points[]` (`SeriesPoint`) for a constituent → Volatility factor + index reconstruction |
| ★ `GET /v1/cards/{game}/{set}/{card}/trades?window&scope&limit` | Trade history → Liquidity factor (trade frequency), recent-sales list |
| `GET /v1/cards/{game}/{set}/{card}/fmv-series` | Daily FMV series (median/mean/**vwap**, `scorerVersion`) — reference for our own index method |
| `GET /v1/cards/{game}/{set}/{card}` / `/overview` | Card detail + grade-agnostic overview |
| `GET /v1/cards/featured?limit` | Top movers across games → overview movers |
| `GET /v1/trades/recent?limit` | Cross-card recent trades feed → recent-sales UI |
| `GET /v1/sets/{game}/{set}` | All cards in a set (finer categories if needed) |
| `GET /v1/search?q&limit` | Free-text search (v2 SRCH-01) |
| `GET /v1/graded/{cert}` (+ `/stream` SSE) | Cert lookup (nice-to-have "verify a slab" demo beat) |
| `GET /v1/health`, `GET /health` | Liveness (source health indicator) |

**Categories for v1** = the three games (`pokemon`, `one-piece`, `sports`) as top-level index tiles (satisfies "3–5 categories"); sets available as finer cuts if time allows.

## Key schemas (verbatim field names)

**IndexTile** (`/v1/indices`): `game, label, value(num), base(num), deltas, constituentCount(int), rebalance, sparkline[](SeriesPoint), topMovers[](IndexMover), updatedAt(date-time|null)`
**IndexConstituent** (in `IndexDetail`): `rank(int), name, setName, setCode, cardNumber, grade, imageUrl, priceUsdCents(int|null), deltaPct(num|null), lastSaleAt(date-time|null), href`
**Deltas**: `d7(num|null), d30(num|null), d365(num|null)`
**SeriesPoint**: `t(date-time), usdCents(int≥0), source(str|null), bucket(public|renaiss|partner|null), n(int≥0), kind(transaction|listing|null), company, grade, gradeLabel`
**CardDetail**: `id, game, name, setName, setCode, cardNumber, variation, language, imageUrl, company, grade, gradeLabel, priceUsdCents(int|null), deltas, confidence, sourceCount, observationCount, observationWindowDays, totalObservationCount, updatedAt, lastSaleAt, refreshing, sourceBreakdown[], methods[](FmvMethodValue), otherGrades[], similar[](CardSummary), href`
**CardSummary**: `game, type(POKEMON|ONE_PIECE|SPORTS), name, setName, setCode, cardNumber, variation, language, imageUrl, company(PSA|BGS|CGC|SGC|RAW|TAG), grade, gradeLabel, priceUsdCents(int|null), deltaPct(num|null), confidence(high|medium|low|null), lastSaleAt, spark[](int), href`
**FmvMethodValue**: `method(median|mean|vwap), scorerVersion, label, priceUsdCents(int|null), confidence, sourceCount(int|null), observationCount(int|null)`
**TradeRow**: `source, bucket, displayName, observedAt, kind(listing|transaction), priceUsdCents(int|null), currency, company, grade, gradeLabel, sourceUrl`
**SourceBreakdownEntry**: `source, bucket, displayName, count(int≥0), medianUsdCents(int|null)`
**GradedLookup**: `cert, certNumber, company, found(bool), grade, gradeLabel, card(CardSummary|null), certImages, reason(...)`

All monetary values are integer **USD cents** (`priceUsdCents` / `usdCents`) — normalize to a `Money` type at the adapter boundary.

## Risk-engine input mapping (Tessera's IP — Phase 2)

| Factor | Real-data inputs | Higher risk when |
|--------|------------------|------------------|
| **Liquidity** | `/trades` count over window, `observationCount`/`observationWindowDays`, `sourceCount`, `lastSaleAt` recency | few trades, thin sources, stale last sale |
| **Volatility** | `series[].usdCents` dispersion (stdev/CoV), magnitude of `deltas` d7/d30/d365, `spark[]` variance | large price swings |
| **Concentration** | `IndexDetail.constituents[]` share of top-N by `priceUsdCents`/rank; `sourceBreakdown[]` single-source dominance | value concentrated in few cards or one source |
| **Data confidence** | `confidence(high\|medium\|low)`, `sourceCount`, `observationCount`, freshness = age of `updatedAt`/`lastSaleAt` | low confidence, small sample, stale |

**Insufficient-data rule (maps to real fields):** render `INSUFFICIENT_DATA` (not a score) when `confidence == "low"` OR `observationCount < MIN_SAMPLE` OR age(`updatedAt`) > `MAX_STALE_DAYS`. Thresholds are versioned constants defined in Phase 2 (`METHODOLOGY.md`) and seeded so the thin category trips them live.

## Mock / real seam

- `DataSource` interface shaped around the endpoints above (normalized entities: `Category`≈index tile, `Constituent`, `Sale`≈TradeRow, `PricePoint`≈SeriesPoint), every value wrapped in the provenance envelope `{ value | insufficient, confidence, sampleSize, source, asOf }`.
- `RenaissSource`: real adapter → `api.renaissos.com/v1/*`, USD-cents→Money, `confidence`/`updatedAt`→envelope, 429 `Retry-After` handling, optional API-key headers, aggressive cache.
- `MockSource`: fixtures shaped identically (ideally captured from real responses), including one deliberately-thin category + a momentum spike + a concentrated market. Default source; `RenaissSource` swapped in at one wiring point.

## Open items for planning

- **Partner credentials?** Ask the user whether they have `X-Api-Key`/`X-Api-Secret` (10k/day). If not, run public-tier cached snapshot + mock. Design for optional env vars either way.
- **Exact enums / nested shapes** (`IndexMover`, `IndexDetail`, `rebalance`, `bucket` values) — confirm from the live spec or one real call during Phase 1 if `api.renaissos.com` is reachable from the build env.
- **Own index vs consume Renaiss index:** default = display Renaiss's index (attributed) and additionally compute a reproducible VWAP→100 index from `/trades` for the "verify by hand" methodology + safety story. Settle in Phase 2.
