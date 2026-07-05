# Requirements: Tessera

**Defined:** 2026-07-05
**Core Value:** A judge or collector can open Tessera, understand the collectible market at a glance, and trust the numbers because every source, timestamp, and confidence band is visible — then drill into one category — all without explanation.

## v1 Requirements

Requirements for the v1 demo. Each maps to exactly one roadmap phase.

### Data Layer & API (DATA)

- [ ] **DATA-01**: A normalized data layer exposes categories, collectibles/listings, sales, and price time-series behind a single `DataSource` interface
- [ ] **DATA-02**: A `MockSource` serves clearly-labeled seed fixtures; a `RenaissSource` stub exists so a real source can be swapped in at one wiring point without any UI or engine change
- [ ] **DATA-03**: Every metric crosses the wire inside a shared envelope `{ value | insufficient, confidence, sampleSize, source, asOf }` — the API cannot emit a bare or unsourced number
- [ ] **API-01**: A cached JSON API serves overview, category-list, category-detail, and index-series endpoints

### Market Overview (OVW)

- [ ] **OVW-01**: User can see total listings and total volume across all tracked categories on the overview
- [ ] **OVW-02**: User can see top movers — categories with the largest index change over the window
- [ ] **OVW-03**: User can see every tracked category with its current index level and risk score at a glance

### Category Index (IDX)

- [ ] **IDX-01**: User can view a per-category price index chart (level over time), normalized to 100 at the base period, for 3–5 categories
- [ ] **IDX-02**: The index is a deterministic, reproducible volume-weighted average price of the category
- [ ] **IDX-03**: The index renders explicit gaps / "insufficient data" for periods with too few sales instead of interpolating a fabricated line

### Risk Score (RISK)

- [ ] **RISK-01**: User can see a per-category composite risk score (0–100)
- [ ] **RISK-02**: User can expand the risk score to see its factor breakdown (Liquidity, Volatility, Concentration, Data confidence) that visibly reconciles to the headline number
- [ ] **RISK-03**: The risk score is deterministic and versioned — identical inputs yield an identical score, and the score carries an engine version tag
- [ ] **RISK-04**: The risk score shows a confidence band reflecting sample size and data freshness
- [ ] **RISK-05**: When data is too thin, risk renders "insufficient data" instead of a fabricated score

### Category Detail (DET)

- [ ] **DET-01**: User can open a category detail view showing floor price, volume, and recent sales
- [ ] **DET-02**: Category detail shows the index chart and the full risk factor breakdown for that category
- [ ] **DET-03**: Recent sales list shows individual sale points with their timestamps (from seed data)

### Provenance & Safety (PROV)

- [ ] **PROV-01**: Every displayed metric shows a source label and a freshness (as-of) timestamp via a shared, reusable metric component
- [ ] **PROV-02**: At least one category is deliberately seeded thin so the live "insufficient data" state is demonstrable in the walkthrough
- [ ] **PROV-03**: No derived value is presented as a verified valuation; index and risk outputs carry explicit caveats

### Ship & Demo (SHIP)

- [ ] **SHIP-01**: The app is deployed to a public URL and client-side routing survives refresh/deep-link (SPA rewrite configured)
- [ ] **SHIP-02**: A pre-demo verification sweep passes: every visible number has a source + real timestamp, scores reproduce and reconcile, index = 100 at base, axes are honest and labeled, no color-only cues, and the thin category renders insufficient-data live

## v2 Requirements

Deferred to future release. Tracked but not in the current roadmap.

### Discovery & Personalization

- **SRCH-01**: User can search / filter across categories
- **WATCH-01**: User can save a watchlist of categories (in-memory or local storage)
- **ALERT-01**: User sees a simple in-app alert when a category crosses a threshold

### Ecosystem

- **API-02**: The public JSON API is documented (endpoints, shapes, provenance) so other builders can consume it — cheap ecosystem bonus; pull into v1 if time allows

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Wallet connection / transactions / trading execution | v1 is read-only market intelligence; no funds move |
| Auth, accounts, or private user data | Reduces risk surface; matches the "no private data" safety criterion |
| Mobile-native build | Responsive web only within the one-week window |
| Numbers presented as verified valuations | Safety rule — always a scored signal with a confidence band, never a guarantee |
| Real-time streaming / live market feeds | Mock/seed snapshot data is sufficient for the demo |
| ML / black-box risk scoring | Score must be deterministic, versioned, and explainable |
| Per-item (single-collectible) valuation pages | v1 operates at the category level |
| Social feeds / comments / sharing UGC | Out of the market-intelligence core |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| _(populated by roadmapper)_ | — | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: _(pending roadmap)_
- Unmapped: _(pending roadmap)_

---
*Requirements defined: 2026-07-05*
*Last updated: 2026-07-05 after initial definition*
