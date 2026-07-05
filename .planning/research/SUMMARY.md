# Project Research Summary

**Project:** Tessera
**Domain:** Read-only market-intelligence dashboard ("Bloomberg terminal lite") for real-world collectibles — per-category price indices + explainable risk score, on labeled mock/seed data
**Researched:** 2026-07-05
**Confidence:** HIGH

## Executive Summary

Tessera is a read-only analytics dashboard, not a transactional app — and all four research dimensions converge hard on the same shape: a linear, one-directional read pipeline (**source -> normalize -> compute -> cache -> serve -> render**) with a ports-and-adapters seam at the data boundary and pure, deterministic math in the middle. Experts build this exact class of tool (Card Ladder, NFTPriceFloor, Nansen) as a normalized data layer feeding a small cached JSON API that a React SPA renders. Because there are no writes, no auth, and no mutations, most of the complexity budget is freed to spend on the two things that actually win this hackathon: a **transparent, confidence-banded, source-labeled risk-scored index** (the whitespace neither the NFT camp nor the physical-collectibles camp ships) and demo reliability.

The recommended build is a **Vite + React SPA deployed to Vercel with a `/api` directory of serverless functions** — explicitly *not* Next.js, whose Cache Components model is conceptual tax with zero payoff for a client-rendered dashboard. Vercel runs `/api` functions for any project, so the "single deploy vs split backend" tradeoff dissolves: one `git push` ships both the SPA and a genuinely public JSON API (the cheapest ecosystem-bonus point on the board). The stack is Recharts (declarative SVG index lines with native support for reference lines, gap bands, and source-label overlays), **zod as the single schema source** (`z.infer` gives types for free and enforces the mock->real seam at every source boundary), TanStack Query (which directly powers loading/error/insufficient-data states), Tailwind v4 + shadcn/ui, Vitest (for the spec-required engine tests), and pnpm (installs shadcn/Recharts cleanly with no peer-dep flags). In-repo typed JSON fixtures behind a `DataSource` interface — **not SQLite** — because the seam is the interface, not the storage, and a DB file is a live-failure surface for zero demo benefit.

The dominant risk is not crashes — it is **trust failure**. The pitfalls research is unambiguous: a polished dashboard that lies at a glance (fabricated numbers on thin data, a black-box or "verified valuation" risk score, missing/fake provenance, truncated chart axes, a leaky mock seam) scores *worse* on the actual Safety/Clarity/Usability/Innovation rubric than a plainer one that is honest. The mitigation is structural, and it is what makes the innovation and the safety proof the *same artifact*: a shared metric envelope (`{ value | insufficient, confidence, sampleSize, source, asOf }`) so the API physically cannot emit a bare or unsourced number; a pure, versioned risk engine whose factor contributions reconcile to the headline; and an explicit `INSUFFICIENT_DATA` state (with at least one deliberately-thin seed category) rendered instead of any invented value. Front-load the data/metric layer, harden the golden path early, and reserve an explicit deploy/demo/submission phase with a pre-demo verification sweep as a gate.

## Key Findings

### Recommended Stack

Vite + React SPA on Vercel with a root `/api` directory of serverless functions — a single deployable that is simultaneously a clean SPA and a public JSON API, without adopting Next.js. All versions were verified against the npm registry and official docs on 2026-07-05 (not training memory), including React 19 peer compatibility across Recharts/shadcn, Vite 8 <-> Vitest 4, and the Tailwind v4 Vite plugin. The one gotcha to bake in at project creation: a `vercel.json` `/(.*)` -> `/index.html` rewrite so client-side routing survives refresh/deep-links (`/api/*` is auto-excluded). See STACK.md.

**Core technologies:**
- **Vite 8 + React 19** (`@vitejs/plugin-react-swc`): client-rendered dashboard runtime with near-instant HMR — far less machinery than Next.js under time pressure.
- **Vercel Functions (`/api` dir)**: cached JSON API with zero server to crash mid-demo; `Cache-Control: s-maxage, stale-while-revalidate` lets the CDN cache.
- **zod 4**: the linchpin of the mock->real seam — one schema per domain object, every source parsed through it, `z.infer` for free types (single source of truth for API + data layer).
- **Recharts 3.9**: mature React charting default — declarative SVG, right fit for 3-5 readable index lines; native `ReferenceLine`/`ReferenceArea`/`Label` for base=100 lines, gap bands, and source overlays (not candlesticks).
- **TanStack Query 5**: owns server state — fetch/cache/dedupe/loading/error/empty, which directly maps onto the "insufficient data" UI.
- **Tailwind v4 + shadcn/ui + Vitest 4 + pnpm**: fast readable styling (first-party Vite plugin, no PostCSS dance), owned Radix primitives (Card/Table/Tabs/Badge/Tooltip), engine unit tests, clean installs.
- **In-repo typed JSON fixtures behind `DataSource`** — NOT SQLite/Prisma/any DB (live-failure surface for 3-5 categories of seed data; contradicts "demo must never be blocked").

### Expected Features

The physical-collectibles camp nails normalized indexes but ignores risk; the NFT camp has risk-ish signals but they are opaque and gated. Tessera's whitespace is the honesty layer neither ships. See FEATURES.md.

**Must have (table stakes / DEMO-CRITICAL):**
- **Normalized data layer + cached JSON API** — the foundation everything sits on and the demo's reliability guarantee.
- **Market overview KPIs** (total listings, volume, top movers) — the "at a glance" opening beat.
- **Per-category price index chart** (volume-weighted, base=100, 3-5 categories, time-range toggle) — the core drill-in object.
- **Category detail view** (floor, volume, recent sales, risk factors) — the "drill into one" beat.
- **Risk score with visible factor breakdown** (0-100) — the Innovation + Clarity centerpiece; the breakdown *is* the feature.
- **Confidence bands** on index/score — encodes trust visually; core to the Safety framing.
- **Per-metric source label + freshness timestamp** — the trust primitive; makes mock data honest (more important on seed data, not less).
- **"Insufficient data" safety state** — a first-class render state, scripted as a demo beat to prove the safety design on purpose.
- **Responsive terminal-style layout + category nav** — the shell everything lives in.

**Should have (competitive, pull in if time — in this order):**
- **Public JSON API (documented endpoints)** — near-free once the data layer exists; the cheapest Ecosystem point. *Do this first of the should-haves.*
- **Search / filter across categories** — pure client-side.
- **Saved watchlist (localStorage)** — personalization without accounts/PII (reinforces the safety stance).
- **In-app threshold alerts** + **mover <-> risk-shift tie-in** — the trader "signal" narrative ("up 12%, but risk rose").

**Defer (v2+ / anti-features):**
- Real Renaiss data source integration (the seam exists precisely so this drops in later).
- Per-item/sub-category granularity, operator digests, cross-category correlation.
- **Anti-features (deliberately not built):** wallet/trading execution, auth/accounts, mobile-native, any number as a *verified valuation*, real-time streaming, ML/black-box risk model — each is off-mission or a direct safety violation; the restraint is part of the story.

### Architecture Approach

A read-only analytics pipeline with data flowing one direction only: the SPA never computes risk or index, the API never does math, the engines never do I/O, and the source never knows who consumes it — each layer depends only on the layer below via a typed contract. The single most important structural decision is the **`DataSource` port** (one interface, `MockSource` now / `RenaissSource` stub later); the second is the **provenance-wrapped value** so a bare number cannot exist on the wire. Keep directories cleanly separated (`core` / `data` / `api` / `web`) even if formal workspaces cost too much time — the boundaries matter more than the packaging. See ARCHITECTURE.md.

**Major components:**
1. **`core/` (pure analytics)** — versioned Risk Engine (Liquidity / Volatility / Concentration / Data-confidence factors -> 0-100 + confidence band | `INSUFFICIENT_DATA`) and Index Engine (VWAP -> rebased to 100 at a qualifying base period, explicit gaps never interpolated). Zero I/O, zero framework; the part judges scrutinize, unit-tested with Vitest on hand-built cases.
2. **`data/` (the seam)** — `DataSource` interface + `MockSource` over hand-authored JSON fixtures (seed one deliberately-thin category) + `RenaissSource` stub; every entity carries `Provenance { source, asOf, confidence }`.
3. **`api/` (thin HTTP + cache)** — wires `DataSource` -> engines -> precomputed in-memory cache at boot; serves `/overview`, `/categories`, `/categories/:id`, `/index/:id/series`; `serialize.ts` attaches provenance to every metric. No math here.
4. **`web/` (React SPA)** — `Overview` + `CategoryDetail` views composed from reusable `PriceIndexChart`, `RiskBreakdown`, and first-class `Provenance` / `ConfidenceBadge` / `InsufficientData` components (they encode the safety contract, so they are shared, not per-view discipline).

### Critical Pitfalls

The most dangerous failures make the product *untrustworthy*, not crashed — and every one maps to a judged criterion. See PITFALLS.md.

1. **Fabricating numbers on thin data** — a floor/index/score rendered off n=1 or n=2 collapses the whole "trust the numbers" pitch. Avoid: make "insufficient" a first-class *return value of the metric layer* (the UI cannot render what the layer refused to compute), version explicit thresholds, and seed a thin category so the state is always exercised and demoable.
2. **Opaque or non-reproducible risk methodology** (black-box, mis-summing factors, or "verified valuation" language) — directly violates the "no black box" requirement and torpedoes Clarity/Safety. Avoid: pure, deterministic, versioned scoring (no clock/random in the path); factor contributions that visibly reconcile to the headline; a confidence band on every score; ban "fair value / verified / safe / guaranteed" copy.
3. **Missing or fake provenance** — no source label, or a render-time timestamp masquerading as freshness. Avoid: `source` + `asOf` as *required fields* on the metric envelope (a metric without them is a type error), carried end-to-end; label seed data unmistakably as mock.
4. **Index construction errors** (base not pinned to 100, mismatched base periods, unweighted outliers/wash-trade dominance, silent interpolation across gaps). Avoid: pin the base deterministically so re-seeding cannot shift it; share one base period across categories; volume-weight with outlier caps + min-sample-per-point; break the line at gaps; hand-verify one category's math.
5. **Misleading charts** (auto-fit truncated axes exaggerating small moves; dual axes implying false correlation) — and **readability/color-only cues** failing the "at a glance" pitch on a projector. Avoid: deliberate honest axis baselines (anchor around 100, label base period/units), small multiples over dual-axis, redundant cues (up/down arrows, +/- signs, labels) beyond color, contrast >= 4.5:1 tested projector-like.
6. **Over-scoping the one week** — building deferred features while the golden path stays fragile; broken hosted link / missing clip / private repo at submission. Avoid: protect the golden path as the definition of done, build the hardest beats (risk breakdown + insufficient-data) first, rehearse against the *deployed* URL early, reserve buffer for bugs + submission.

## Implications for Roadmap

The dependency graph dictates a strict bottom-up sequence — nothing depends on a later stage, so the demo stays viable even if the last stages are trimmed. Front-load the data/metric contract (it constrains every downstream phase and a leaky seam is the most expensive pitfall to fix late), and add an explicit deploy/demo/submission phase at the end (the pitfalls research calls this out specifically). Suggested structure:

### Phase 1: Data Layer + Metric Contract (the seam)
**Rationale:** Everything depends on these shapes; a seam designed *after* the mock leaks the mock's quirks and falsifies the whole architectural bet (Pitfall 6, HIGH recovery cost late). Design the domain contract first, then make the mock implement it.
**Delivers:** `Provenance` + metric envelope (`{ value | insufficient, confidence, sampleSize, source, asOf }`), normalized entity types (`Category`, `Collectible/Listing`, `Sale`, `PricePoint`), the async `DataSource` interface, `MockSource` over hand-authored JSON fixtures (including one deliberately-thin category and modeled loading/empty/error paths), `RenaissSource` stub, and zod schemas as the single source of truth.
**Addresses:** Normalized data layer (the foundation all features sit on).
**Avoids:** P6 (leaky seam), and pre-wires P1/P3 (insufficient-data + provenance as required fields, not UI afterthoughts).

### Phase 2: Analytics Engines (risk + index)
**Rationale:** This is the innovation and the part judges scrutinize; it depends only on Phase 1 types and must be deterministic and testable before anything renders it.
**Delivers:** Pure, versioned Risk Engine (Liquidity/Volatility/Concentration/Data-confidence -> 0-100 + confidence band | `INSUFFICIENT_DATA`, factors reconciling to the headline) and Index Engine (VWAP -> base=100 at a qualifying period, explicit gaps), a shared `thresholds.ts`, and Vitest tests on known inputs (liquid/volatile/concentrated/thin cases -> known outputs).
**Uses:** Vitest + `@vitest/coverage-v8` (prove the `INSUFFICIENT_DATA` branch is tested).
**Implements:** `core/` — pure, deterministic, versioned analytics.
**Avoids:** P2 (black-box/non-reproducible score) and P4 (index construction errors).

### Phase 3: API + Cache
**Rationale:** A thin boundary that wires the port to the engines and precomputes into an in-memory cache — depends on Phases 1-2, and delivers the public JSON API as an intrinsic byproduct.
**Delivers:** `/overview`, `/categories`, `/categories/:id`, `/index/:id/series` as Vercel `/api` functions; boot-time precompute + cache; `serialize.ts` attaching provenance to every metric; `Cache-Control` headers; `vercel.json` SPA rewrite.
**Uses:** Vercel Functions + zod response validation (same schemas as the data layer).
**Implements:** `api/` — thin HTTP + cache; no math.
**Avoids:** P3 (bare numbers on the wire), and the recompute-per-render performance trap.

### Phase 4: Frontend Views + Charts (golden path)
**Rationale:** Composes the demo's core walkthrough end-to-end; depends on the API contract. Build the hardest beats (risk breakdown, insufficient-data) here, not last.
**Delivers:** `Overview` + `CategoryDetail` views, `PriceIndexChart` (honest axes, base-period label, visible gaps), `RiskBreakdown`, TanStack Query hooks mapping loading/error/empty to the safe states. The 60-90s walkthrough works end-to-end.
**Uses:** Recharts, TanStack Query, Tailwind v4 + shadcn/ui.
**Addresses:** Overview KPIs, index chart, category detail, risk breakdown.
**Avoids:** P5 (truncated/dual axes) — set honest baselines from the start.

### Phase 5: Trust & Safety UI + Polish (the closer)
**Rationale:** The provenance/confidence/insufficient-data affordances are the demo's closing proof and appear everywhere, so they are built as shared components applied across all prior layers — lands last because it depends on them.
**Delivers:** `Provenance` / `ConfidenceBadge` / `InsufficientData` components applied everywhere; correct data-`asOf` timestamps (never render-time); confidence bands visible; the thin-category safe state rendered on stage; copy audit (ban valuation language + persistent disclaimer); colorblind-safe palette + redundant cues + contrast pass.
**Addresses:** Source labels + freshness, confidence bands, insufficient-data state.
**Avoids:** P2 (copy audit), P3 (real timestamps), P8 (readability/accessibility).

### Phase 6: Deploy, Demo & Submission (explicit gate)
**Rationale:** The pitfalls research is explicit that submission mechanics fail at the last minute and false local confidence is the classic hackathon killer — this needs to be a named phase with a verification sweep, not an afterthought.
**Delivers:** Deployed Vercel link rehearsed against the real URL; recorded 60-90s clip; public repo verified; the "Looks Done But Isn't" checklist run as a gate (every visible number has source + real `asOf`; two engine runs match; index = 100 at base and reproduces by hand; no NaN / dash / 0 where a value belongs; no color-only cues; no seed imports outside the adapter).
**Avoids:** P7 (fragile demo / broken submission) — reserve buffer here per the one-week constraint.

*(Should-haves — public API docs, search, watchlist, alerts — are pulled into Phases 3-5 opportunistically once the golden path is hardened, in that priority order; each is independent and cut without hesitation.)*

### Phase Ordering Rationale

- **Bottom-up by dependency:** ARCHITECTURE.md's build order is unambiguous — types/data -> engines -> API -> views -> trust UI. Each stage is independently testable and nothing depends on a later one, so the demo survives trimming.
- **Grouped by architectural boundary:** phases map 1:1 to the `core` / `data` / `api` / `web` seams, keeping the "no math in the API, no I/O in the engine, no source-coupling in the UI" contract honest.
- **Trust-first, not polish-last:** provenance and insufficient-data are pre-wired as *required fields* in Phase 1 (structural), then surfaced as UI in Phase 5 — so the safety contract is enforced by types, not remembered per screen.
- **Explicit demo phase:** every pitfall converges on "the hosted demo is the real product" — Phase 6 exists because the highest-frequency failure is a broken link/clip/repo at the deadline.

### Research Flags

Phases likely needing deeper research during planning (`/gsd-research-phase`):
- **Phase 2 (Analytics Engines):** the three genuinely-open decisions live here — exact **risk factor weights**, **thin-data / min-sample thresholds**, and the **index base-period definition**. The *shape* is fully specified (pure/versioned/reconciling, VWAP->base=100), but the specific numbers need a short methodology decision (and a checked-in `METHODOLOGY.md`) so scores are defensible live.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Data Layer):** ports-and-adapters + anti-corruption-layer is a settled pattern, precisely prescribed in ARCHITECTURE.md.
- **Phase 3 (API + Cache):** Vercel `/api` functions + precompute-and-cache is documented and thin.
- **Phase 4 (Frontend):** Recharts + TanStack Query dashboard composition is a mature, corroborated default.
- **Phase 5 (Trust UI) & Phase 6 (Deploy/Demo):** driven by explicit checklists in PITFALLS.md, not open questions.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Every version + peer range verified against the npm registry and official Vercel/shadcn/Next docs on 2026-07-05, not training memory. |
| Features | HIGH | Feature landscape well-documented across NFT analytics + physical-collectibles tools; index/AVM methodology corroborated by multiple authoritative sources. |
| Architecture | HIGH | Ports-and-adapters, provenance-wrapped values, pure-versioned analytics, and precompute-cache are established patterns; the composition is directly prescribed by the project constraints. |
| Pitfalls | HIGH | Index-construction, thin-liquidity, chart-deception, explainability, and adapter-seam findings verified against BLS/IMF, NFT wash-trading research, XAI literature, and pattern docs (hackathon-scoping findings MEDIUM). |

**Overall confidence:** HIGH — the four dimensions agree with unusual coherence; the only genuine unknowns are decision parameters, not the approach.

### Gaps to Address

- **Risk factor weights (open decision):** the four factors are fixed but their relative weights are not. Handle in Phase 2 planning — pick defensible weights, document them in `METHODOLOGY.md`, and pin with table-driven tests. Low risk (deterministic and swappable).
- **Thin-data / min-sample thresholds (open decision):** the `INSUFFICIENT_DATA` gate and confidence-band width need concrete numbers (e.g. floor >= N listings, index point >= M sales). One shared `thresholds.ts` notion of "enough data" for both engines; decide in Phase 2, encode as named constants.
- **Index base-period definition (open decision):** which reference period is base=100, and how `t0` advances if the natural start is sub-threshold. Decide in Phase 2; store the base deterministically so re-seeding cannot shift it.
- **Real Renaiss data access (unresolved CTO question, out of scope for v1):** existence of an approved API/SDK/indexer is unknown (spec section 8). The `DataSource` seam exists precisely so this is additive — v1 does not depend on it; `RenaissSource` is stubbed to prove the seam compiles.
- **Seed data realism (execution risk):** fixtures must include a deliberately-thin category, a momentum spike, and a concentrated market so all engine branches and the safety state are exercised. Address during Phase 1 fixture authoring, not later.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view ... version` / peerDependencies), 2026-07-05 — all stack version numbers + peer-dep ranges (React 19.2.7, Vite 8.1.3, Recharts 3.9.2, zod 4.4.3, TanStack Query 5.101.2, Vitest 4.1.9, Tailwind 4.3.2, pnpm 11.10.0).
- Vercel Functions Quickstart & Vite on Vercel — `/api` functions for `framework=other`; SPA rewrite requirement.
- shadcn/ui Vite install & React 19 support — React 19 + Tailwind v4 install path.
- TanStack Query docs & caching guide — server-state caching/dedupe/loading-error.
- Context7 `/recharts/recharts` — declarative SVG overlay APIs (ReferenceLine/ReferenceArea/Label).
- Ports-and-adapters (hexagonal) + Anti-Corruption Layer pattern (Microsoft Learn) — the swappable-source seam.
- BLS CPI FAQ & IMF Updating CPI Weights / Linking Series — index reference periods, rebasing via linking.
- IAAO Standard on AVMs — thin markets -> wider bands / no estimate.
- NFT wash-trading research: arXiv 2312.16603, Springer Financial Innovation, ScienceDirect (10% wash-volume ~1% return then reversal).
- Accessibility: Section508 color usage (WCAG 1.4.1), WebAIM contrast.
- Tessera `.planning/PROJECT.md` — constraints, safety rules, judging criteria, mock-first data decision.

### Secondary (MEDIUM confidence)
- LogRocket Best React chart libraries 2026 & chart-library comparisons — Recharts as the React dashboard default; canvas/Lightweight-Charts only for candlestick/large data.
- Next.js 16 blog — the opt-in Cache Components model that motivates skipping Next.js.
- Card Ladder / NFTPriceFloor / DappRadar / Nansen feature landscape and Card Ladder CL50 / index methodology — normalized index conventions.
- XAI: Tredence Explainable AI in Finance, Palo Alto Unlocking the Black Box — show which signals drove the score.
- Chart deception: Tableau check the axes, Helical Insight misleading dual-axis.
- Hackathon Guide & DEV/DoraHacks good submissions — teams accomplish ~25% of plan; broken links/repos at submission.

### Tertiary (LOW confidence)
- Leaky Abstractions (Joel on Software) & leaky abstraction by omission (ploeh) — conceptual framing for the async/error side-channel in the mock seam.
- Keploy mock testing — mocks create false confidence; over-specified mocks are fragile.

---
*Research completed: 2026-07-05*
*Ready for roadmap: yes*
