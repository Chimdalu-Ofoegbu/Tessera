# Roadmap: Tessera

## Overview

Tessera is built bottom-up along its dependency graph so that every stage is independently demoable and nothing depends on a later one — if the last phase is trimmed, the demo still stands. First the normalized data layer and the shared metric envelope pin the contract every layer downstream obeys (a bare, unsourced number becomes impossible by type). Then the pure, versioned analytics engines (risk + index) compute the numbers judges scrutinize, with `INSUFFICIENT_DATA` as a first-class outcome. A thin cached JSON API wires the source to the engines and serves the SPA (and, for free, a public API). The React views compose the 60–90s walkthrough end to end. The trust/safety UI — provenance labels, confidence bands, the live insufficient-data state — is the closing proof, applied everywhere as shared components. A final, explicit deploy/demo/submission phase runs the pre-demo verification sweep as a gate against the classic hackathon killer: a broken link, clip, or repo at the deadline.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Data Layer & Metric Contract** - Normalized `DataSource` seam, provenance-wrapped metric envelope, and mock fixtures (including a deliberately-thin category)
- [ ] **Phase 2: Analytics Engines (Risk + Index)** - Pure, versioned risk and index engines with reconciling factors, base=100 rebasing, and a first-class `INSUFFICIENT_DATA` outcome
- [ ] **Phase 3: API & Cache** - Cached JSON API that wires source to engines and serves provenance on every metric with an SPA-safe deploy config
- [ ] **Phase 4: Frontend Views & Charts** - Overview and category-detail views with the index chart and risk breakdown — the end-to-end walkthrough
- [ ] **Phase 5: Trust & Safety UI + Polish** - Shared provenance/confidence/insufficient-data affordances, honest copy, and accessibility applied everywhere
- [ ] **Phase 6: Deploy, Demo & Submission** - Public deploy rehearsed against the real URL, recorded clip, and the pre-demo verification sweep run as a gate

## Phase Details

### Phase 1: Data Layer & Metric Contract
**Goal**: Establish the normalized data contract every downstream layer obeys, so a bare or unsourced number cannot exist and the mock→real swap is a one-line change.
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, PROV-02
**Success Criteria** (what must be TRUE):
  1. All fixtures load and conform to the normalized entity shapes (`Category`, `Collectible/Listing`, `Sale`, `PricePoint`) through a single `DataSource` interface.
  2. Every entity carries a `{ source, asOf, confidence, sampleSize }` envelope — the type system rejects a value that lacks source or timestamp.
  3. Swapping `MockSource` for the `RenaissSource` stub touches exactly one wiring point and requires no change to any consumer.
  4. The seed set includes at least one deliberately-thin category (below the sample threshold) plus a momentum-spike and a concentrated market, so every engine branch and the safety state have real data to exercise.
**Plans**: TBD

### Phase 2: Analytics Engines (Risk + Index)
**Goal**: Compute the risk score and price index as pure, deterministic, versioned functions whose outputs are reproducible, explainable, and honest under thin data.
**Depends on**: Phase 1
**Requirements**: IDX-02, IDX-03, RISK-03, RISK-05
**Success Criteria** (what must be TRUE):
  1. Running the risk engine twice on identical inputs yields an identical score, and the result carries an engine version tag.
  2. The four risk factors (Liquidity, Volatility, Concentration, Data confidence) sum/reconcile to the headline score in unit tests on hand-built liquid/volatile/concentrated cases.
  3. The index is a reproducible volume-weighted average price rebased so the base period reads exactly 100, verifiable by hand for one category.
  4. A category or index period below the shared sample threshold returns `INSUFFICIENT_DATA` / an explicit gap rather than a fabricated number or interpolated line — proven by a covered test on the thin case.
**Plans**: TBD
**Research**: yes — open decisions live here: risk factor weights, thin-data/min-sample thresholds, and the index base-period definition. Pick defensible values, record them in `METHODOLOGY.md`, and pin with table-driven tests.

### Phase 3: API & Cache
**Goal**: Serve the computed results over a thin, cached JSON API that attaches provenance to every metric and never does math — simultaneously a public API and the SPA's backend.
**Depends on**: Phase 2
**Requirements**: API-01, SHIP-01
**Success Criteria** (what must be TRUE):
  1. `curl`-ing `/overview`, `/categories`, `/categories/:id`, and `/index/:id/series` returns well-shaped JSON with provenance present on every metric.
  2. An endpoint whose underlying data is thin surfaces the explicit insufficient/gap status rather than a bare number.
  3. Payloads are precomputed into a cache at boot, so repeated requests return identical, instant responses across the whole demo.
  4. The SPA rewrite is configured so a deep-linked route survives a hard refresh while `/api/*` still resolves.
**Plans**: TBD

### Phase 4: Frontend Views & Charts
**Goal**: Compose the demo's core walkthrough — read the overview, drill into one category, see its index chart and reconciling risk breakdown.
**Depends on**: Phase 3
**Requirements**: OVW-01, OVW-02, OVW-03, IDX-01, RISK-01, RISK-02, DET-01, DET-02, DET-03
**Success Criteria** (what must be TRUE):
  1. On the overview a user sees total listings, total volume, top movers, and every tracked category with its current index level and risk score at a glance.
  2. A user can open a category detail view showing floor price, volume, and a recent-sales list with individual timestamped sale points.
  3. The per-category index chart renders level-over-time for 3–5 categories with an honest baseline anchored around 100 and visible gaps where data is missing (never an interpolated line).
  4. A user can expand the risk score to see its factor breakdown, and the factors visibly reconcile to the headline number.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Trust & Safety UI + Polish
**Goal**: Surface the trust contract everywhere as the demo's closing proof — visible sources, real freshness, confidence bands, honest copy, and the live insufficient-data state.
**Depends on**: Phase 4
**Requirements**: RISK-04, PROV-01, PROV-03
**Success Criteria** (what must be TRUE):
  1. Every displayed metric shows its source label and a real data `asOf` timestamp (never a render-time clock) via one shared, reusable metric component.
  2. The risk score displays a confidence band that visibly widens as sample size shrinks or data ages.
  3. Opening the deliberately-thin category renders the "insufficient data" affordance live instead of any number.
  4. No index or risk output is presented as a verified valuation — explicit caveats and a persistent disclaimer are present, and banned valuation language ("fair value / verified / safe / guaranteed") is absent; cues are redundant (not color-only) and pass a projector-like contrast check.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Deploy, Demo & Submission
**Goal**: Ship a rehearsed public demo and pass the pre-demo verification sweep as a hard gate, guarding against a broken link, clip, or repo at the deadline.
**Depends on**: Phase 5
**Requirements**: SHIP-02
**Success Criteria** (what must be TRUE):
  1. The app is live at a public URL and the 60–90s walkthrough has been rehearsed against that real URL (not just localhost).
  2. A recorded 60–90s clip exists and the repository is confirmed public.
  3. The verification sweep passes: every visible number has a source + real timestamp, two engine runs match, index = 100 at base and reproduces by hand, no NaN/dash/0 where a value belongs, no color-only cues, and no seed imports outside the adapter.
  4. The deliberately-thin category renders the insufficient-data state live during the rehearsed run.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Layer & Metric Contract | 0/TBD | Not started | - |
| 2. Analytics Engines (Risk + Index) | 0/TBD | Not started | - |
| 3. API & Cache | 0/TBD | Not started | - |
| 4. Frontend Views & Charts | 0/TBD | Not started | - |
| 5. Trust & Safety UI + Polish | 0/TBD | Not started | - |
| 6. Deploy, Demo & Submission | 0/TBD | Not started | - |
