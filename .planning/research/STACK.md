# Stack Research

**Domain:** Data-dashboard SPA (financial/time-series index charts) + small cached JSON API + mock-first normalized data layer + testable deterministic scoring engine
**Researched:** 2026-07-05
**Confidence:** HIGH

> All versions below verified against the npm registry and official docs on 2026-07-05, not training memory. Peer-dependency compatibility (React 19 across Recharts/shadcn, Vite 8 ↔ Vitest 4, Tailwind v4 Vite plugin) was checked explicitly — see Version Compatibility.

## Headline Recommendation

**Vite + React SPA, deployed to Vercel as one full-stack app, with a `/api` directory of Vercel Functions serving the cached JSON API.** Not Next.js.

The decisive fact: Vercel runs serverless functions for **any** project via files in a root `/api` directory (`framework=other`, standard `export default { async fetch(req) {…} }` handler, Node runtime) — no framework required ([Vercel Functions Quickstart](https://vercel.com/docs/functions/quickstart)). So the "single deployable full-stack app vs split" tradeoff dissolves: Vite gives you the split-brain simplicity (a plain SPA + a handful of stateless JSON endpoints) **and** a single `git push` deploy, without adopting Next.js 16's new opt-in `use cache` / Cache Components model — a real conceptual tax that buys this project nothing in a one-week window. You get a genuinely public, clean JSON API (the ecosystem-bonus goal) as an intrinsic byproduct, not an afterthought.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **React** | 19.2.7 | UI runtime | Universally supported by every library below; the default for a data dashboard. Stable, no RC caveats. |
| **Vite** | 8.1.3 | Build tool + dev server | Instant HMR, zero-config TS, tiny mental model. SPA output is a static bundle Vercel serves directly. Far less machinery than Next.js for a client-rendered dashboard. |
| **TypeScript** | 6.0.3 | Language | Non-negotiable for a scoring engine + normalized data contracts. Enforces the data-layer seam at compile time so mock→real swap can't silently drift. |
| **@vitejs/plugin-react-swc** | 4.3.1 | React transform for Vite | SWC is faster than Babel; keeps dev startup and rebuilds near-instant during a time-boxed build. (Plain `@vitejs/plugin-react` 6.0.3 is a fine fallback if any SWC edge case appears.) |
| **Vercel Functions** (`/api` dir) | platform | Cached JSON API | Serverless Node functions with zero server to run/maintain. Set `Cache-Control: s-maxage=…, stale-while-revalidate` on responses → Vercel's CDN does the caching. Demo-reliable: no process to crash. |
| **Recharts** | 3.9.2 | Index/line + KPI charts | The mature React default in 2026: SVG, excellent TS types, SSR-safe, declarative JSX composition. Source-label overlays, base=100 reference line, and "insufficient data" bands are all native (`ReferenceLine`, `ReferenceArea`, `Customized`, `Label`). Right fit for 3–5 readable index lines — not high-frequency candlesticks. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zod** | 4.4.3 | Schema/validation for API + data-layer contracts | The linchpin of the mock→real seam. Define one schema per domain object (Category, PricePoint, RiskScore); the data layer parses every source (mock now, Renaiss later) through it. Also validates/serializes API responses. `z.infer` gives you the TS types for free — single source of truth. |
| **@tanstack/react-query** | 5.101.2 | Client data fetching/cache | Handles loading/error/empty states (directly powers the "insufficient data" UI), request dedup, and a clean `queryFn` boundary to the `/api` layer. Removes hand-rolled fetch/`useEffect` glue. Optional but high-ROI for demo polish. |
| **Tailwind CSS** | 4.3.2 | Styling | Fast, consistent, readable dashboard styling with no CSS-file sprawl. v4 has a first-party Vite plugin (`@tailwindcss/vite`) — no PostCSS config dance. |
| **@tailwindcss/vite** | 4.3.2 | Tailwind v4 Vite integration | The official v4 install path for Vite. One line in `vite.config.ts`. |
| **shadcn/ui** | CLI (`shadcn@latest`) | Accessible UI primitives | Copy-in Radix-based components (Card, Table, Tabs, Badge, Tooltip) you own and restyle — ideal for KPI cards, category tables, risk-factor breakdowns, and source/timestamp tooltips. Fully supports React 19 + Tailwind v4. Not an npm dependency you're locked into. |
| **lucide-react** | latest | Icons | Ships with shadcn/ui; clean icons for trend up/down, info/caveat, freshness. |
| **date-fns** | latest | Timestamp formatting | Format freshness timestamps and index time axes without pulling Moment. Only if native `Intl.DateTimeFormat` proves insufficient. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Vitest** | 4.1.9 | Unit-test the risk engine + index math (spec-required). Same Vite config/transform → zero extra build setup. Jest-compatible API. Use `describe/it/expect` with table-driven cases (known inputs → known 0–100 scores, base=100 normalization, volume-weighting). |
| **@vitest/coverage-v8** | 4.1.9 | Coverage for the engine | Prove the deterministic engine's branches (esp. the "insufficient data" path) are tested. |
| **@testing-library/react** | 16.3.2 | Optional component smoke tests | Only if time allows; the engine tests are the priority per spec. |
| **pnpm** | 11.10.0 | Package manager | Fast, disk-efficient, strict. **Bonus:** shadcn/ui + Recharts install cleanly under pnpm/bun/yarn with **no** `--force`/`--legacy-peer-deps`, unlike npm. Removes a whole class of install friction. (Plain **npm** is acceptable if preferred, but expect to pass `--legacy-peer-deps` occasionally.) |
| **ESLint + Prettier** | latest | Lint/format | Use the Vite React-TS template defaults; don't over-configure in a one-week build. |

## Installation

```bash
# 1. Scaffold (Vite React + TypeScript + SWC)
pnpm create vite@latest tessera -- --template react-swc-ts
cd tessera && pnpm install

# 2. Core data + charts + validation
pnpm add recharts@3 zod@4 @tanstack/react-query@5

# 3. Styling (Tailwind v4 + official Vite plugin)
pnpm add tailwindcss@4 @tailwindcss/vite@4
# then add tailwindcss() to plugins in vite.config.ts and
#   @import "tailwindcss"; to src/index.css

# 4. UI primitives (interactive — pulls Radix + lucide as needed)
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add card table tabs badge tooltip

# 5. Testing (risk engine + index math)
pnpm add -D vitest@4 @vitest/coverage-v8@4
#   optional: @testing-library/react@16 jsdom

# 6. Deploy API: create files under /api (e.g. api/overview.ts, api/category/[id].ts)
#    add vercel.json for SPA deep-link rewrites (see Version Compatibility)
```

## Data Layer & Mock→Real Seam (spec-critical)

**Recommendation: in-repo TypeScript/JSON fixtures behind a `DataSource` interface — NOT SQLite.**

```
src/data/
  schema.ts        # zod schemas → z.infer types (Category, PricePoint, RiskFactors…)
  DataSource.ts    # interface: getOverview(), getCategory(id), getIndexSeries(id)…
  mock/
    fixtures.ts    # clearly-labeled SEED data (typed, parsed through schema.ts)
    MockDataSource.ts
  renaiss/         # future: RenaissDataSource implements the SAME interface
```

Why fixtures over SQLite:
- **Demo reliability:** no DB file, migrations, or driver to fail live. Data ships in the bundle.
- **The seam is the interface, not the storage.** Swapping in Renaiss later means writing one class that implements `DataSource` and parses the real payload through the same zod schemas. The UI and risk engine never change.
- **zod is the contract enforcer:** every fixture is validated at load, so mock data can't diverge from the shape the real source must satisfy. This is exactly the "clean seam" the project demands.
- SQLite would only earn its keep if you needed ad-hoc querying/joins over a large dataset — out of scope for 3–5 categories of seed data. It adds setup and a live-failure surface for zero demo benefit.

The API layer (`/api/*` Vercel Functions) imports the same `DataSource`, so mock data flows through the identical code path that real data will — the public JSON API is real from day one, just backed by seed data (and labeled as such per the source/timestamp requirement).

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vite + React SPA + `/api` functions | **Next.js 16 (App Router)** | If you needed SSR/SEO, server components, or the app were content-heavy/multi-route with data-fetching-in-render. For a client-rendered dashboard, Next.js 16's new opt-in `use cache`/Cache Components model ([Next.js 16](https://nextjs.org/blog/next-16)) is conceptual overhead with no payoff here. |
| Recharts | **TradingView lightweight-charts 5.2.0** | If the core were high-frequency **candlestick/OHLC** trading views over large tick datasets where canvas render performance dominates ([Lightweight Charts v5](https://www.tradingview.com/blog/en/tradingview-lightweight-charts-version-5-50837/)). For 3–5 readable index lines with arbitrary source-label overlays and mixed KPI layouts, Recharts' declarative SVG composition wins on readability + dev speed. |
| Recharts | **Apache ECharts 6.1.0 / visx 4.0.0** | ECharts if you need exotic chart types or huge datasets (heavier, imperative, less React-native). visx if you need fully bespoke D3-level custom viz and have the time to build primitives up from scratch — too low-level for a one-week dashboard. |
| Vercel Functions (`/api`) | **Hono 4.12.27 / Fastify / Express** on a separate server | If you needed a long-running stateful server, WebSockets, or complex routing/middleware. Here it would add a second deployable, a process that can crash mid-demo, and CORS/hosting overhead — all avoidable. (If a standalone Node server is ever required, Hono is the modern pick: tiny, Web-standard `Request`/`Response`, runs on Vercel too.) |
| pnpm | **npm / bun** | npm is fine but occasionally needs `--legacy-peer-deps` with shadcn/Recharts. bun is fast but slightly less battle-tested for this exact toolchain; pnpm is the low-risk sweet spot. |
| TanStack Query | **Plain `fetch` + `useState`** | Acceptable given the API is tiny and cached server-side. Query still pays for itself via free loading/error/empty-state handling that maps onto the "insufficient data" requirement — keep it unless dependency budget is truly maxed. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Next.js 16 for this SPA** | New Cache Components / `use cache` model and RSC boundaries are real learning cost; SSR/SEO unneeded for a dashboard. Slower to reason about under time pressure. | Vite + React SPA + `/api` Vercel Functions |
| **SQLite / Prisma / any DB** | Live-failure surface (file, migrations, driver) for 3–5 categories of seed data; adds setup with zero demo benefit. Contradicts "demo must never be blocked." | In-repo typed fixtures behind a `DataSource` interface |
| **A separate Express/Fastify/Hono server (as a second deployment)** | Second process to run and crash; CORS + hosting overhead; splits the deploy. | `/api` directory Vercel Functions in the same project |
| **TradingView lightweight-charts (as the primary lib)** | Optimized for candlesticks/large tick data on canvas; weaker for arbitrary source-label overlays, KPI cards, and declarative React composition. Annotations need plugin/manual work. | Recharts |
| **Chart.js 4.5.1** | Canvas, imperative, non-React-idiomatic; wrappers add friction; overlays/annotations are clumsier than Recharts JSX. | Recharts |
| **Moment.js** | Large, legacy, mutable API. | `Intl.DateTimeFormat`, or date-fns if needed |
| **Redux / Zustand / heavy global state** | A read-only dashboard has little cross-cutting client state; TanStack Query already owns server state. Adds boilerplate. | React local state + TanStack Query (+ Context only if a watchlist lands) |
| **Tailwind v3 + PostCSS config** | Superseded; v4's `@tailwindcss/vite` plugin is simpler and current. | Tailwind v4 + `@tailwindcss/vite` |
| **Recharts `react-is` override** (old shadcn advice) | Stale: Recharts 3.9.2 no longer declares `react-is` as a direct dependency and lists React 19 in peerDeps. The historic override is unnecessary. | Nothing — install Recharts 3 directly |
| **An ML/statistical "risk model" library** | Spec mandates a **deterministic, versioned, explainable** engine with a visible factor breakdown. A black-box model violates the Clarity/Safety criteria. | Hand-written pure TypeScript scoring functions, unit-tested with Vitest |

## Stack Patterns by Variant

**If the risk engine needs to show a version + factor breakdown (it does):**
- Implement it as pure functions in `src/risk/` returning `{ score, version, factors: [{name, weight, value, contribution}], confidence, insufficientData }`.
- Because it's pure + deterministic, Vitest table-driven tests pin every factor's contribution and the `insufficientData` gate on known inputs. Bump `version` on any formula change so the UI can display it (satisfies "versioned").

**If you want the public JSON API to be a real ecosystem asset:**
- Keep `/api/*` responses schema-validated with the **same** zod schemas as the data layer, include `source` + `asOf` timestamp fields in every payload, and set `Cache-Control: s-maxage=300, stale-while-revalidate=600`.
- Because the mock `DataSource` and future Renaiss `DataSource` share an interface, the public API contract is stable across the data swap — external builders integrate once.

**If time runs short:**
- Drop TanStack Query → plain `fetch` in a small hook; drop @testing-library → engine Vitest tests only (the spec-required ones). Everything else stays.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| recharts@3.9.2 | react@19.2.7 | peerDeps explicitly list `^19.0.0`. No `react-is` override needed (not a direct dep in v3). Verified via npm. |
| vitest@4.1.9 | vite@8.1.3 | Vitest 4 peer allows `vite ^6 || ^7 || ^8`. Same config/transform as the app. Verified via npm. |
| @tailwindcss/vite@4.3.2 | vite@8.1.3 | Plugin peer allows `vite ^5.2 || ^6 || ^7 || ^8`. Verified via npm. |
| shadcn/ui (latest) | react@19 + tailwind@4 | Official Vite + Tailwind v4 + React 19 install path exists ([shadcn Vite install](https://ui.shadcn.com/docs/installation/vite)). Under **pnpm/bun/yarn** no peer flags needed; under **npm** may need `--legacy-peer-deps`. |
| next@16.2.10 | node >=20.9.0 | (Only relevant if Next were chosen — it is not.) Requires React 19. |
| Vite SPA on Vercel | `vercel.json` rewrite | Deep-linking needs a rewrite of `/(.*)` → `/index.html` ([Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)). `/api/*` functions are excluded from the rewrite automatically. |
| Node runtime | 20.x / 22.x | Target Node 22 LTS for Vercel Functions and local dev; matches Vitest `@types/node` peer and Vite 8. |

**One gotcha to bake into the roadmap:** the Vercel Vite SPA needs a `vercel.json` with a `/(.*)` → `/index.html` rewrite for client-side routing to survive page refresh/deep-links. Add it at project creation so it's never a live-demo surprise.

## Sources

- npm registry (`npm view … version` / `dependencies` / `peerDependencies`), 2026-07-05 — HIGH confidence on all version numbers and peer-dep ranges (react 19.2.7, vite 8.1.3, typescript 6.0.3, zod 4.4.3, vitest 4.1.9, recharts 3.9.2, @tanstack/react-query 5.101.2, tailwindcss 4.3.2, @tailwindcss/vite 4.3.2, @vitejs/plugin-react-swc 4.3.1, pnpm 11.10.0, hono 4.12.27, lightweight-charts 5.2.0, echarts 6.1.0, chart.js 4.5.1, @visx/visx 4.0.0)
- [Vercel Functions Quickstart](https://vercel.com/docs/functions/quickstart) (last_updated 2026-03-20) — HIGH: confirms `/api` functions work for `framework=other` (no Next.js) with the `export default { async fetch }` handler
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) (last_updated 2026-03-09) — HIGH: SPA rewrite requirement + Functions guidance
- [shadcn/ui — Vite install](https://ui.shadcn.com/docs/installation/vite) & [React 19 support](https://ui.shadcn.com/docs/react-19) — HIGH: React 19 + Tailwind v4 fully supported; peer-flag guidance per package manager
- Context7 `/recharts/recharts` (v3.3.0 indexed; High reputation, 244+ snippets) — HIGH: Recharts is the mature React charting default; declarative overlay APIs confirmed
- [Next.js 16 blog](https://nextjs.org/blog/next-16) & [cacheComponents config](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) — HIGH: confirms the opt-in `use cache`/Cache Components model that motivates skipping Next.js here
- [TradingView Lightweight Charts v5](https://www.tradingview.com/blog/en/tradingview-lightweight-charts-version-5-50837/) & [Chart.js vs Lightweight Charts vs TradingView (index.dev, 2026)](https://www.index.dev/skill-vs-skill/tradingview-vs-lightweight-charts-vs-chartjs) — MEDIUM: positions lightweight-charts for candlestick/perf-critical financial views vs Recharts for React dashboards
- [LogRocket — Best React chart libraries in 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/) — MEDIUM: corroborates Recharts as the practical React dashboard default

---
*Stack research for: data-dashboard SPA with time-series index charts + cached JSON API + mock-first data layer + deterministic scoring engine*
*Researched: 2026-07-05*
