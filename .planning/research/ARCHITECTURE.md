# Architecture Research

**Domain:** Read-only market-intelligence dashboard ("Bloomberg terminal lite") over collectibles data — normalized data layer + deterministic analytics + cached JSON API + React SPA
**Researched:** 2026-07-05
**Confidence:** HIGH (patterns are standard and well-established; the specific composition is prescribed for this project)

## Standard Architecture

This is a **read-only analytics pipeline**, not a transactional app. The dominant, correct pattern is a **linear read pipeline** with a **ports-and-adapters (hexagonal) seam** at the source boundary and **pure deterministic transforms** in the middle. Data flows one direction: source → normalize → compute → cache → serve → render. There are no writes, no auth, no mutations — which removes most of the complexity budget and lets a single builder finish in a week.

The single most important structural decision is the **DataSource port**: one interface, two implementations (`MockSource` now, `RenaissSource` later). Everything downstream (risk engine, index, API, UI) depends only on the normalized entity shapes, never on where they came from. This is what makes the mock→real swap a one-line wiring change instead of a rewrite.

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React SPA)                            │
│  ┌────────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────────┐  │
│  │  Overview  │  │   Category   │  │   Chart   │  │  Provenance /  │  │
│  │    View    │  │  Detail View │  │Components │  │ Confidence UI  │  │
│  └─────┬──────┘  └──────┬───────┘  └─────┬─────┘  └───────┬────────┘  │
│        └────────────────┴────────────────┴────────────────┘           │
│                          │ (TanStack Query hooks)                      │
├──────────────────────────┼─────────────────────────────────────────────┤
│                          ▼   HTTP (cached JSON, provenance on every metric)
│                     API LAYER (lightweight server)                     │
│  ┌──────────┐ ┌──────────────┐ ┌───────────────┐ ┌─────────────────┐  │
│  │/overview │ │ /categories  │ │/categories/:id│ │/index/:id/series│  │
│  └────┬─────┘ └──────┬───────┘ └───────┬───────┘ └────────┬────────┘  │
│       └──────────────┴─────────────────┴──────────────────┘           │
│                          │  reads from ▼ (in-memory cache)             │
├──────────────────────────┼─────────────────────────────────────────────┤
│                   ANALYTICS (pure, deterministic, versioned)           │
│  ┌────────────────────────────┐   ┌────────────────────────────────┐   │
│  │       RISK ENGINE          │   │         INDEX ENGINE           │   │
│  │ score(0-100) + factors +   │   │  volume-weighted, base=100,    │   │
│  │ confidence band | INSUFF.  │   │  series over time | thin-data  │   │
│  └─────────────┬──────────────┘   └───────────────┬────────────────┘   │
│                └───────────────┬──────────────────┘                    │
├────────────────────────────────┼────────────────────────────────────────┤
│              DATA LAYER (normalized entities + provenance)             │
│                                │  DataSource PORT (interface)          │
│        ┌───────────────────────┴────────────────────────┐             │
│        │                                                  │             │
│  ┌─────▼──────┐                                    ┌──────▼─────────┐  │
│  │ MockSource │  (v1: seed fixtures)               │  RenaissSource │  │
│  │ (fixtures) │                                    │  (future stub) │  │
│  └────────────┘                                    └────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

DATA-FLOW DIRECTION (one way, top of stack reads from bottom):
  Source → normalize → [Risk | Index] compute → cache → API serialize → SPA render
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **DataSource port** | Defines the *only* contract the rest of the system knows: async methods returning normalized entities + provenance. Zero business logic. | A TypeScript `interface` (`getCategories`, `getCollectibles`, `getSales`, `getPricePoints`) |
| **MockSource** | v1 implementation: loads seed fixtures, stamps each with `source: "mock"` and a plausible freshness timestamp/confidence. Deterministic. | Reads JSON fixtures from disk; pure mapping to normalized shapes |
| **RenaissSource** | Future implementation of the same port against a real API/indexer. Not built in v1 — stubbed to prove the seam. | Same interface, throws `NotImplemented` or returns a labeled placeholder |
| **Normalizer** | Guarantees every entity matches the canonical shape and carries `Provenance` regardless of source. Often folded into each Source. | Mapping functions + a shared `Provenance` type |
| **Risk Engine** | Pure function: given a category's normalized data, return `{ version, score, factors[], confidenceBand, status }`. Handles thin data → `INSUFFICIENT_DATA`. No I/O. | Versioned module of pure functions, one per factor + a composer |
| **Index Engine** | Pure function: volume-weighted average price series, normalized to base=100 at start period. Handles missing/thin periods explicitly. | Pure functions over sales/price-point arrays |
| **API Layer** | Thin HTTP boundary. Reads precomputed results from cache, serializes to JSON, attaches provenance to every metric. No business logic. | Express/Fastify/Hono handlers, or static JSON generation |
| **Cache** | Holds computed overview/category/index payloads so requests are instant and demo-stable. | In-memory object built once at boot (or on interval); trivially swappable for static files |
| **SPA Views** | Overview + Category Detail. Compose charts + provenance affordances. Render `INSUFFICIENT_DATA` instead of any number. | React function components |
| **Data-fetching layer** | Fetches/caches API responses client-side; exposes loading/error/data states. | TanStack Query hooks |
| **Provenance UI** | Reusable affordance rendering source label + freshness + confidence next to any metric. | Small `<Provenance>` / `<ConfidenceBadge>` components |

## Recommended Project Structure

A **monorepo with a shared `core` package** is the highest-leverage layout: the pure analytics + types live in one place, imported by both the API and (optionally) the frontend, and are unit-tested in isolation. Even without formal workspaces, keep these directories cleanly separated so the boundaries stay honest.

```
tessera/
├── packages/
│   ├── core/                       # PURE, no I/O, no framework — the testable heart
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── entities.ts      # Category, Collectible/Listing, Sale, PricePoint
│   │   │   │   ├── provenance.ts    # Provenance { source, asOf, confidence }
│   │   │   │   └── results.ts       # RiskResult, IndexSeries, ApiPayload shapes
│   │   │   ├── risk/
│   │   │   │   ├── factors/
│   │   │   │   │   ├── liquidity.ts
│   │   │   │   │   ├── volatility.ts
│   │   │   │   │   ├── concentration.ts
│   │   │   │   │   └── dataConfidence.ts
│   │   │   │   ├── compose.ts       # combine factors → 0-100 + band
│   │   │   │   ├── thresholds.ts    # min-sample rules → INSUFFICIENT_DATA
│   │   │   │   └── version.ts       # RISK_ENGINE_VERSION = "1.0.0"
│   │   │   ├── index/
│   │   │   │   ├── vwap.ts          # volume-weighted average price
│   │   │   │   ├── normalize.ts     # rebase to 100 at base period
│   │   │   │   └── series.ts        # period bucketing + gap handling
│   │   │   └── index.ts             # public exports
│   │   └── test/                    # unit tests on known cases (co-located or here)
│   │       ├── risk.test.ts
│   │       └── index.test.ts
│   │
│   ├── data/                       # THE SEAM — sources + fixtures
│   │   ├── src/
│   │   │   ├── DataSource.ts        # interface (the PORT)
│   │   │   ├── MockSource.ts        # v1 adapter
│   │   │   ├── RenaissSource.ts     # future adapter (stub)
│   │   │   └── fixtures/
│   │   │       ├── categories.json
│   │   │       ├── collectibles.json
│   │   │       ├── sales.json
│   │   │       └── pricePoints.json
│   │   └── ...
│   │
│   ├── api/                        # thin HTTP boundary + cache
│   │   ├── src/
│   │   │   ├── server.ts            # boots server, wires DataSource → core → cache
│   │   │   ├── cache.ts             # build + hold computed payloads
│   │   │   ├── routes/
│   │   │   │   ├── overview.ts
│   │   │   │   ├── categories.ts
│   │   │   │   ├── categoryDetail.ts
│   │   │   │   └── indexSeries.ts
│   │   │   └── serialize.ts         # attach provenance to every metric
│   │   └── ...
│   │
│   └── web/                        # React SPA
│       ├── src/
│       │   ├── main.tsx
│       │   ├── api/
│       │   │   ├── client.ts        # base fetch wrapper
│       │   │   └── queries.ts       # TanStack Query hooks
│       │   ├── views/
│       │   │   ├── Overview.tsx
│       │   │   └── CategoryDetail.tsx
│       │   ├── components/
│       │   │   ├── PriceIndexChart.tsx
│       │   │   ├── RiskBreakdown.tsx
│       │   │   ├── Provenance.tsx    # source + timestamp affordance
│       │   │   ├── ConfidenceBadge.tsx
│       │   │   └── InsufficientData.tsx
│       │   └── lib/format.ts
│       └── ...
├── package.json
└── README.md
```

### Structure Rationale

- **`core/`:** Pure functions, zero I/O and zero framework imports. This is the part that MUST be unit-tested (risk + index) and the part judges care about ("no black box"). Keeping it dependency-free means tests run in milliseconds and the logic is portable (server today, could run client-side later).
- **`data/`:** Isolates the mock→real seam. The `DataSource` interface and fixtures live here so the swap is visibly a single-file concern. Fixtures as JSON (not code) makes them easy to hand-edit to force interesting states (a momentum spike, a thin category, a concentrated market) for the demo.
- **`api/`:** Deliberately thin — it wires the port to the engines, caches the result, and serializes. No math lives here. This keeps the HTTP layer swappable (server → static file generation) without touching logic.
- **`web/`:** Views are thin compositions of reusable components. `Provenance`, `ConfidenceBadge`, and `InsufficientData` are first-class components because they appear everywhere and encode the safety contract.
- **Single-builder note:** If workspace tooling costs too much time, collapse to `src/{core,data,api,web}` in one package. The *directory boundaries* matter more than the packaging.

## Architectural Patterns

### Pattern 1: Ports & Adapters (the DataSource seam)

**What:** Define one interface (the "port") that expresses everything the app needs from its data. Provide interchangeable implementations ("adapters"): `MockSource` now, `RenaissSource` later. Nothing downstream imports a concrete source — only the interface and the normalized types.

**When to use:** Whenever a real dependency is unavailable, uncertain, or must be swappable. This is exactly the "data access is an open CTO question" situation.

**Trade-offs:** Tiny upfront cost (one interface, one mapping layer). Massive payoff: the demo is never blocked, tests use the mock trivially, and the real integration is additive. The only risk is designing the interface around mock conveniences instead of real-source realities — mitigate by shaping methods around *what the UI/engines need* (categories, sales, price points), which is source-agnostic.

**Example:**
```typescript
// packages/data/src/DataSource.ts — the PORT
export interface DataSource {
  getCategories(): Promise<WithProvenance<Category>[]>;
  getCollectibles(categoryId: string): Promise<WithProvenance<Collectible>[]>;
  getSales(categoryId: string, window: DateRange): Promise<WithProvenance<Sale>[]>;
  getPricePoints(categoryId: string, window: DateRange): Promise<WithProvenance<PricePoint>[]>;
}

// MockSource and RenaissSource both `implements DataSource`.
// Wiring is one line — the only place the choice is made:
const source: DataSource = new MockSource(fixtures);   // v1
// const source: DataSource = new RenaissSource(config); // later
```

### Pattern 2: Provenance-Wrapped Values (safety by construction)

**What:** Never pass a bare number through the system. Every value carries `{ source, asOf, confidence }`. Because provenance is attached at the source and preserved through every transform, the API *cannot* emit a metric without it, and the UI always has something to render next to the number.

**When to use:** Any time trust/transparency is a first-class product requirement (it is the core value here).

**Trade-offs:** Slightly more verbose types and mapping. In return, the "every metric labeled with source + timestamp" requirement becomes structurally guaranteed rather than something you remember to do per-view.

**Example:**
```typescript
// packages/core/src/types/provenance.ts
export interface Provenance {
  source: string;      // "mock" | "renaiss:floor-indexer" | ...
  asOf: string;        // ISO timestamp — freshness
  confidence: number;  // 0..1 — how much to trust this value
}
export type WithProvenance<T> = T & { provenance: Provenance };

// A metric on the wire always looks like:
// { "value": 128.4, "provenance": { "source": "mock", "asOf": "...", "confidence": 0.82 } }
```

### Pattern 3: Pure, Versioned Analytics with an Explicit "Insufficient" Outcome

**What:** Risk and index are pure functions — same input, same output, no I/O, no clock reads inside the math (pass `now`/window in). Each carries a version tag. Both return a *discriminated result*: either a computed answer or an explicit `INSUFFICIENT_DATA` status. Thin data is a first-class return value, not an exception or a fabricated zero.

**When to use:** Any derived/scored output that must be explainable, testable, and safe under sparse data — the exact judging + safety criteria here.

**Trade-offs:** Forces you to decide sample-size thresholds up front (good — surfaces the safety design). Pure functions are trivially unit-testable on hand-built cases. Cost is near zero.

**Risk engine contract:**
```typescript
// packages/core/src/risk/compose.ts
export const RISK_ENGINE_VERSION = "1.0.0";

export type RiskResult =
  | { status: "OK"; version: string; score: number;            // 0..100
      factors: RiskFactor[]; confidenceBand: [number, number]; }
  | { status: "INSUFFICIENT_DATA"; version: string; reason: string; };

export interface RiskFactor {
  key: "liquidity" | "volatility" | "concentration" | "dataConfidence";
  value: number;    // normalized 0..100 contribution
  weight: number;   // its share of the composite
  detail: string;   // human-readable "why", drives the breakdown UI
}
```

**Risk factor definitions (deterministic, each 0..100, higher = riskier):**

| Factor | Signal | Rough computation | Notes |
|--------|--------|-------------------|-------|
| **Liquidity** | Thin markets are risky | Inverse of listing depth × trade frequency over the window | Few listings / rare trades → high score |
| **Volatility** | Erratic prices are risky | Price dispersion (e.g. stddev/CV of price points) over the window | Normalize against a category-agnostic band |
| **Concentration** | Few items/holders dominating volume is risky | Share of volume in top-N items/holders (Herfindahl-style) | High concentration → high score |
| **Data confidence** | Sparse/stale data is risky | Penalty from sample size + freshness (drives confidence band width) | Directly ties provenance → risk |

Composite = weighted sum of factors → 0..100; the **confidence band** widens as the data-confidence factor worsens. If any category falls below the sample-size threshold in `thresholds.ts`, the whole result short-circuits to `INSUFFICIENT_DATA` and **no score is shown**.

### Pattern 4: Precompute-and-Cache (demo reliability)

**What:** Compute all payloads (overview, each category, each index series) once at boot from the mock source, store in an in-memory cache, and serve reads instantly. Because the source is deterministic, results are stable across the whole demo — no flicker, no recompute jank, no surprise on stage.

**When to use:** Read-heavy dashboards with a bounded dataset — exactly this. Especially valuable for a live/recorded demo where predictability beats freshness.

**Trade-offs:** Data is only as fresh as the last build. For a mock-data demo that is a *feature* (repeatable). When `RenaissSource` lands, swap to a timed rebuild or on-request compute with a short TTL — the cache boundary already exists, so this is a localized change.

## Data Flow

### Request Flow (one direction — read pipeline)

```
[User opens Overview]
      ↓
[Overview.tsx] → [useOverview() TanStack hook] → GET /overview
      ↓                                              ↓
[render metrics + <Provenance>]              [API reads cache]
      ↑                                              ↓
[JSON: values + provenance] ←──────── [serialize] ← [cached payload]
                                                     ↑
                              (built once at boot ↓ from:)
   [MockSource.getX()] → [Normalizer] → [Risk + Index engines] → [Cache]
```

Key property: **the arrow only points one way through the compute stack.** The SPA never computes risk or index; the API never does math; the engines never do I/O; the source never knows who consumes it. Each layer depends only on the layer below via a typed contract.

### State Management

Client-side, **server state ≠ UI state**. Server state (the fetched payloads) is owned entirely by **TanStack Query** — it handles caching, dedupe, loading/error states, and background refresh. Local UI state (which category is selected, whether a risk breakdown is expanded) is trivial React `useState`. No Redux/global store is warranted at this size.

```
[TanStack Query cache]  ← single source of truth for server data
      ↓ (useQuery hooks per endpoint)
[Views] read {data, isLoading, isError}
      ↓
[render: data | <Skeleton> | <ErrorState> | <InsufficientData>]

[Local UI state] via useState (selection, expand/collapse) — no global store
```

### Key Data Flows

1. **Boot/build flow:** On server start, wire `DataSource` → pull normalized entities → run Risk + Index engines per category → assemble overview/category/series payloads (each metric carrying provenance) → store in cache. Deterministic and repeatable.
2. **Overview flow:** `GET /overview` → cache read → JSON (total listings, total volume, top movers, each with provenance) → `Overview.tsx` renders cards + `<Provenance>` badges.
3. **Category-detail flow:** `GET /categories/:id` → cache read → JSON (floor, volume, recent sales, `RiskResult`) → `CategoryDetail.tsx` renders; if `RiskResult.status === "INSUFFICIENT_DATA"`, render `<InsufficientData>` instead of a score, otherwise render `<RiskBreakdown>` with factors + confidence band.
4. **Index-series flow:** `GET /index/:id/series` → cache read → JSON array of `{ period, level, provenance }` normalized to base=100 → `PriceIndexChart.tsx` plots the line; gaps for missing periods are rendered explicitly (broken line / marker), never interpolated silently.
5. **Insufficient-data flow (safety):** Any endpoint whose underlying data is below threshold returns an explicit insufficient status for that metric; the UI's job is purely to render the safe state — the *decision* was made deterministically in `core`, not in the view.

### Index Methodology (specify precisely)

- **Formula (per period t):** volume-weighted average price of the category's constituents:
  `VWAP_t = Σ(price_i × volume_i) / Σ(volume_i)` over items/sales in period *t*.
- **Rebasing:** pick a **base period `t0`**; the published index level is `Index_t = (VWAP_t / VWAP_t0) × 100`, so the series starts at **100** and reads as a percent change over time.
- **Base-period handling:** `t0` must itself clear the sample-size threshold. If the natural start period is too thin, advance `t0` to the first period that qualifies and label the series start accordingly (don't silently rebase to noise).
- **Missing points:** if a period has no qualifying volume, emit an explicit gap (`level: null` + provenance noting the gap). **Do not carry-forward or interpolate** silently — that fabricates data and violates the safety rule. The chart renders the gap visibly.
- **Thin period:** a period that has *some* but sub-threshold volume is marked low-confidence (widened confidence on that point / muted styling), or gapped, per the same `thresholds.ts` rules the risk engine uses — one shared notion of "enough data."

## Scaling Considerations

This is a bounded, read-only, single-builder hackathon app; **real scaling is a non-goal** and premature optimization would burn the week. The table below is about *what would change if it graduated*, not v1 work.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Demo / 0–1k users | In-memory precomputed cache + `MockSource`. A single small server (or even statically generated JSON files) is more than enough. Nothing to optimize. |
| 1k–100k users | Swap `MockSource` → `RenaissSource`; move cache to a timed rebuild or short-TTL per-request compute; put a CDN in front of the JSON API (responses are cacheable — read-only, provenance-stamped). |
| 100k+ users | Precompute into a persistent store / materialized views; CDN-cache aggressively by `asOf`; the pure `core` engines can run as a scheduled job. The port boundary means the compute path never touched the UI. |

### Scaling Priorities

1. **First "bottleneck" is data realism, not load:** the honest limit of v1 is that numbers are mock. The seam is designed so this is the *only* thing that changes — replace one adapter.
2. **Second is freshness:** once real data flows, the precompute-once cache becomes staleness. Introduce a rebuild interval / TTL at the existing cache boundary. No other layer changes.

## Anti-Patterns

### Anti-Pattern 1: Business logic leaking into the API or UI

**What people do:** Compute the risk score or index inside a route handler, or worse, in a React component with `useMemo`.
**Why it's wrong:** It becomes untestable (needs HTTP/React to exercise), non-deterministic, and duplicated. Judges asking "how is this scored?" get pointed at a tangle instead of a clean `core/risk` module.
**Do this instead:** All math lives in pure `core` functions with unit tests. API serializes; UI renders. If a component is doing arithmetic on domain data, it belongs in `core`.

### Anti-Pattern 2: Fabricating a value under thin data

**What people do:** Return `0`, `null` rendered as `—` with no explanation, or interpolate a missing index point to keep the line pretty.
**Why it's wrong:** Directly violates the core safety rule and the value proposition ("trust the numbers"). A silently-invented number is worse than an honest gap.
**Do this instead:** Return an explicit `INSUFFICIENT_DATA` / gap status from `core`, and render a purpose-built `<InsufficientData>` affordance. Make the safe state a *visible feature* — it's literally in the demo script.

### Anti-Pattern 3: Coupling anything to the concrete data source

**What people do:** Import `MockSource` directly in the API or (worse) reference fixture file shapes in the UI.
**Why it's wrong:** Kills the swap. When `RenaissSource` arrives, you're rewriting call sites across layers instead of changing one wiring line.
**Do this instead:** Depend only on the `DataSource` interface and the normalized entity types. The concrete source is chosen in exactly one place (server bootstrap).

### Anti-Pattern 4: Bare numbers on the wire

**What people do:** API returns `{ "floor": 128.4 }` and the UI tries to remember to show a source somewhere.
**Why it's wrong:** Provenance becomes inconsistent — some metrics labeled, some not — undermining the whole trust story.
**Do this instead:** Every metric is `{ value, provenance }` by type. The `<Provenance>` component consumes it uniformly. Transparency is structural, not per-screen discipline.

### Anti-Pattern 5: Reaching for a global state store / heavy framework

**What people do:** Add Redux, a full meta-framework, SSR, a database, or GraphQL "to be safe."
**Why it's wrong:** Every one of those is complexity the one-week window can't afford and the read-only bounded dataset doesn't need. It trades demo-readiness for architecture theater.
**Do this instead:** React SPA + TanStack Query for server state + `useState` for UI state + a thin JSON API over an in-memory cache. Add nothing until a concrete need appears.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Renaiss data source (API/SDK/indexer) | Behind the `DataSource` port as `RenaissSource` | Existence unresolved (spec §8). v1 does NOT depend on it; the port makes it additive. Build the stub to prove the seam compiles. |
| Chart library (Recharts recommended) | Client-side component dependency | Recharts is the pragmatic default: declarative, SVG, fast to build, dataset here is tiny (hundreds of points, well under the ~1k SVG comfort ceiling). Reserve visx/Lightweight-Charts only if a custom/candlestick visual becomes essential — not v1. |
| TanStack Query | Client-side server-state cache | Handles fetch/cache/dedupe/loading/error out of the box; removes hand-rolled fetching code. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| API ↔ Data layer | Direct call through `DataSource` interface | The seam. Only the server bootstrap picks the concrete implementation. |
| API ↔ Analytics (`core`) | Direct function calls (pure) | API passes normalized data in, gets `RiskResult` / `IndexSeries` out. No math in the API. |
| Analytics ↔ Data types | Shared `core/types` | Engines operate on normalized entities; they never see fixtures or HTTP. |
| SPA ↔ API | HTTP JSON via TanStack Query hooks | Contract = the payload shapes (values + provenance). UI never computes derived metrics. |
| Views ↔ shared components | Props | `Provenance`, `ConfidenceBadge`, `InsufficientData`, chart components are reused across both views to keep the safety/trust affordances consistent. |

## Build Order (dependency-derived)

The dependency graph dictates a strict bottom-up sequence. Each stage is independently demoable/testable, and nothing depends on a later stage — so the demo is viable even if the last stages are trimmed.

1. **Types + Data layer (the seam) — build first.** Define normalized entities (`Category`, `Collectible/Listing`, `Sale`, `PricePoint`), `Provenance`, and the `DataSource` interface. Implement `MockSource` over hand-authored JSON fixtures (deliberately seed one thin category to exercise the safety path). Stub `RenaissSource`. *Everything* depends on these shapes; getting them right first prevents downstream churn. **Testable:** fixtures load and conform to shapes.
2. **Analytics: Risk engine + Index engine — build second.** Pure functions in `core`, versioned, with `INSUFFICIENT_DATA`/gap outcomes and the shared `thresholds.ts`. This is the innovation + the part judges scrutinize, so it gets real unit tests on hand-built cases (a liquid category, a volatile one, a concentrated one, a thin one). **Testable:** unit tests pass on known inputs → known scores/levels; thin case → insufficient.
3. **API + Cache — build third.** Wire `DataSource` → engines → precomputed in-memory cache; expose `/overview`, `/categories`, `/categories/:id`, `/index/:id/series`; attach provenance to every metric in `serialize.ts`. **Testable:** curl each endpoint, confirm shapes + provenance present + insufficient states surface.
4. **Frontend: views + charts — build fourth.** `Overview` and `CategoryDetail`, `PriceIndexChart`, `RiskBreakdown`, wired with TanStack Query hooks. Get the happy path readable and the drill-down working. **Demoable:** the 60–90s walkthrough works end to end.
5. **Provenance / confidence / insufficient-data UI + polish — build last.** `Provenance`, `ConfidenceBadge`, `InsufficientData` components applied everywhere; freshness timestamps and confidence bands visible; the thin-category safe state rendered on stage. This is the *closer* of the demo, but it depends on all prior layers, so it lands last. Reserve remaining buffer for bugs + submission per the one-week constraint.

## Sources

- [Best React chart libraries in 2026 — LogRocket](https://blog.logrocket.com/best-react-chart-libraries-2026/) (Recharts as safe SVG default; canvas/Lightweight-Charts only for large/financial-specific datasets) — MEDIUM
- [Choosing a React Chart Library: Recharts vs ECharts vs Nivo vs Lightweight Charts — Gerald Chen](https://chenguangliang.com/en/posts/blog152_react-chart-libraries-comparison/) — MEDIUM
- [TanStack Query — official docs](https://tanstack.com/query/latest) (server-state caching, dedupe, loading/error, background refetch) — HIGH
- [TanStack Query caching guide](https://tanstack.com/query/v4/docs/framework/react/guides/caching) (staleTime / cache-first behavior) — HIGH
- Ports-and-adapters (hexagonal architecture): established pattern for swappable external dependencies — HIGH (well-established architecture principle)
- Volume-weighted index construction + base-period normalization to 100: standard financial index methodology — HIGH (established domain practice)
- Tessera `.planning/PROJECT.md` (constraints, safety rules, judging criteria, mock-first data decision) — HIGH (primary source)

---
*Architecture research for: read-only collectibles market-intelligence dashboard (Tessera)*
*Researched: 2026-07-05*
