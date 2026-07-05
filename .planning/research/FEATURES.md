# Feature Research

**Domain:** Market-intelligence / trading-terminal dashboard for real-world collectibles (Renaiss ecosystem) — "Bloomberg terminal lite"
**Researched:** 2026-07-05
**Confidence:** HIGH (feature landscape is well-documented across NFT analytics + physical-collectibles pricing tools; index/AVM methodology corroborated by multiple authoritative sources)

## How To Read This Doc

Complexity is scoped to a **one-week hackathon on mock/seed data behind a normalized data layer** — not production. So "index construction" is MEDIUM here (deterministic math over seeded arrays), not HIGH (real ingestion pipeline). Each feature is tagged with:

- **Complexity:** S / M / L (relative build cost inside the demo)
- **Users:** Collector (C) / Trader (T) / Operator (O)
- **Judging:** Usability (Us) / Innovation (In) / Ecosystem (Ec) / Clarity (Cl) / Safety (Sa)
- **Tier:** `DEMO-CRITICAL` (must exist for the 60–90s walkthrough) vs `SHOULD-HAVE` (pull in if time)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Every serious market-intelligence dashboard — NFT (NFTPriceFloor, DappRadar, Nansen, Blur) and physical collectibles (Card Ladder, Market Movers, VCP) — ships these. Missing them = "this isn't a market tool."

| Feature | Why Expected | Complexity | Users / Judging | Tier | Notes |
|---------|--------------|------------|-----------------|------|-------|
| **Market overview KPIs** (total listings, total volume, top movers) | The universal "landing" of every analytics tool (DappRadar top collections, Card Ladder market summary). First thing every user reads. | S | C, T, O / Us, Ec | DEMO-CRITICAL | 3–5 headline stat cards + a top-movers table (biggest % gainers/losers by category). Pure aggregation over the data layer. This is the "understand at a glance" moment. |
| **Per-category price index chart** (level over time, base = 100) | Card Ladder CL50 / player indexes are literally this. Collectors track "is my segment up or down." A normalized index reads instantly on a line chart. | M | C, T, O / Us, In, Ec | DEMO-CRITICAL | Volume-weighted, normalized to 100 at a base period (see ARCHITECTURE / STACK). 3–5 categories. Time-range toggle (7D/30D/90D/All) is expected and cheap. This is the core "drill in" object. |
| **Category detail view** (floor, volume, recent sales, factors) | Every tool has a "click the collection → see its page" pattern (NFTPriceFloor collection page, Card Ladder player page). Floor + volume + recent-sales list is the canonical trio. | M | C, T / Us, Cl | DEMO-CRITICAL | One category expanded: current floor, volume, an index sparkline, a short recent-sales table, and the risk factor breakdown. This is the demo's "drill into one category" beat. |
| **Risk score with visible factor breakdown** (0–100) | Advanced NFT tools (Nansen-tier) score liquidity, time-to-sale, volatility, and wash-trading exposure. Users expect a single "how healthy/risky is this" read. Tessera's twist is making it *explainable*. | M | C, T, O / In, Cl, Sa | DEMO-CRITICAL | Score = deterministic weighted blend of named factors (e.g., liquidity/volume depth, volatility, sales-frequency/thinness, momentum). Each factor shown with its own sub-score + weight + one-line plain-English meaning. **No black box** — the breakdown IS the feature. See PITFALLS on factor selection. |
| **Per-metric source label + freshness timestamp** | Trust primitive. On mock data this is *more* important, not less — it's how you stay honest and win Clarity/Safety. Real tools show "data from X, updated Y." | S | C, T, O / Cl, Sa | DEMO-CRITICAL | A small "Source: seed/mock · as of <ts>" chip attached to every number-bearing panel. Trivial to build, disproportionately valuable for judging. Make the mock/seed origin unmissable. |
| **"Insufficient data" safety state** | AVM/valuation convention: thin markets → wider bands or *no estimate at all*. Tessera renders this instead of any fabricated number when data is thin. | S | C, T, O / Sa, Cl | DEMO-CRITICAL | A first-class render state (not an error) for a category/metric below a data threshold (e.g., < N sales in the window). Shows *why* it's insufficient. This is a scripted demo beat — proves the safety design on purpose. |
| **Responsive layout** (desktop-first, degrades to tablet/mobile web) | Any dashboard demoed on a projector/phone must not break. "Responsive web only" is in-scope. | S | all / Us | DEMO-CRITICAL | Desktop terminal-style multi-panel grid that reflows to a single column. Not mobile-*native* (explicitly out of scope). |
| **Category list / navigation** | Users need to move between the 3–5 categories. A sidebar or tab strip is the minimum. | S | all / Us | DEMO-CRITICAL | Cheap, but required glue between overview and detail. Doubles as the surface for search/filter later. |

### Differentiators (Competitive Advantage)

These are where Tessera earns Innovation/Clarity/Safety points and separates from a plain price list. Aligned to Core Value: *trust the numbers because sources, timestamps, and confidence are visible.*

| Feature | Value Proposition | Complexity | Users / Judging | Tier | Notes |
|---------|-------------------|------------|-----------------|------|-------|
| **The risk-scored INDEX itself** (not just a price list) | This is the headline innovation from PROJECT.md. Card Ladder gives an index; NFT tools give risk signals — Tessera fuses them: a per-category index *paired with* a transparent risk read on that same segment. | M | C, T, O / In, Ec | DEMO-CRITICAL | Emergent from combining the index chart + risk breakdown into one coherent category story. The *pairing* is the differentiator; both halves are already table-stakes-adjacent. Lead the demo with this framing. |
| **Confidence bands on the index / score** | AVM standard: 70% band is narrower than 90%; thin data → wider band. Visually encodes "how much to trust this," which is exactly the Safety criterion. Directly supports "never a guarantee." | M | C, T / Cl, Sa, In | DEMO-CRITICAL | Shaded band around the index line and/or a ± range on the risk score, widening as underlying sample thins. Deterministic function of sample size/dispersion. Pairs with (and gracefully precedes) the "insufficient data" cutoff. High judging ROI. |
| **Search / filter across categories** | Standard in mature tools; speeds navigation once there are >5 segments. Listed as a should-have in PROJECT.md. | S | T, O / Us | SHOULD-HAVE | Client-side filter over the loaded category set (name/attribute). No backend needed. Nice for "usability" but not required for the scripted walkthrough. |
| **Saved watchlist** (in-memory / localStorage) | Traders/operators track a subset. Universal feature (Coinbase/CoinGecko star icon). No auth needed if local-only — which *reinforces* the "no accounts/private data" safety stance. | S | T, O / Us, Sa | SHOULD-HAVE | Star a category → persists to localStorage. Zero server, zero PII. A clean way to show "personalization without accounts." Good should-have if time. |
| **Simple threshold alerts** (in-app) | "Tell me when floor drops below X / risk crosses Y." Momentum/risk-shift detection is the trader's core job-to-be-done. | M | T / In, Us | SHOULD-HAVE | In-app only (no email/push — that's infra + PII). Evaluate thresholds against the current data snapshot and surface a badge/toast. Depends on watchlist for the natural UX, but can stand alone. |
| **Clean public JSON API** | Bonus ecosystem points; lets other Renaiss builders reuse Tessera's normalized data + scores. PROJECT.md flags it as potential ecosystem value. | S | O / Ec, Cl | SHOULD-HAVE | The indexer/aggregator already serves cached JSON to the SPA — exposing 2–3 read-only, documented endpoints (`/categories`, `/categories/:id`, `/overview`) is nearly free and demoably "reusable." Strong Ecosystem signal for low cost. |
| **Momentum / top-movers surfacing on the index** | Traders scan for volume spikes and sharp moves. Highlighting biggest movers + volume anomalies turns a static chart into a signal. | S | T, O / In, Us | SHOULD-HAVE | Largely overlaps with the table-stakes top-movers KPI; the differentiator is tying a mover directly to its index + risk-shift ("up 12%, but risk rose"). Cheap narrative upgrade. |

### Anti-Features (Deliberately NOT Built)

Documented so they don't creep back in. These are explicitly out of scope in PROJECT.md, and each is a *feature*, not just an omission — the restraint is part of the safety story.

| Feature | Why Requested | Why Problematic (here) | Alternative |
|---------|---------------|------------------------|-------------|
| **Wallet connection / transactions / trading execution** | "It's a market tool — let me trade." | Moves funds → massive risk/security surface, out of a 1-week read-only scope, and off-mission (v1 is intelligence, not execution). | Read-only market intelligence. Show the signal; the user acts elsewhere. |
| **Auth / accounts / any private user data** | "Save my prefs / portfolio across devices." | PII + auth = risk surface and directly violates the "no private data" safety criterion. Adds infra with no demo payoff. | Local-only watchlist (localStorage). Personalization without identity. |
| **Mobile-native app** | "Traders live on their phones." | Can't build + ship native in one week; splits focus. | Responsive web that degrades cleanly to mobile browsers. |
| **Any number presented as a verified valuation / guarantee** | "Just tell me what it's worth." | The cardinal safety rule. A confident point-estimate on opaque/mock data is exactly the failure mode AVMs guard against — invites misplaced trust and is dishonest on seed data. | Always a *scored signal* with a confidence band + source + timestamp; "insufficient data" when thin. Never "worth $X," always "signal, caveated." |
| **Real-time / live-tick streaming** | "Bloomberg is real-time." | Websocket infra + flicker + reliability risk for a demo, on data that's mocked anyway. No judging payoff. | Cached snapshot with a visible freshness timestamp. "As of" honesty > fake liveness. |
| **ML / AI black-box risk model** | "Use AI for the score, it sounds smarter." | Un-explainable → kills Clarity, and can't show a factor breakdown (a must-have). Overkill and non-deterministic for a demo. | Deterministic, versioned, weighted scoring function whose factors are the UI. |
| **Deep per-item / sub-category granularity** (individual collectible pages, order books, market depth like Blur) | "I want to price one specific item." | Explodes data + UI scope; Tessera's unit is the *category index*, not the item. | Category-level floor/volume/recent-sales. Item-level is a v2+ concern. |
| **Social / comments / community feed** | "Add engagement." | Off-mission, moderation/PII burden, no judging tie-in. | Operator-facing market-health read + (later) digests, no UGC. |

---

## Feature Dependencies

```
[Normalized data layer + cached JSON API]   <- foundation, everything sits on this
        |
        +--feeds--> [Market overview KPIs] ---------> [Top-movers surfacing]
        |
        +--feeds--> [Per-category index chart] --+
        |                                        +--combine--> [Risk-scored INDEX (headline)]
        +--feeds--> [Risk score + factor breakdown]
        |                 |
        |                 +--extends--> [Confidence bands]
        |                                     |
        |                                     +--precedes--> ["Insufficient data" state]
        |
        +--feeds--> [Category detail view] (composes index + floor + sales + risk)
        |
        +--attaches--> [Source label + freshness timestamp]  (on every number panel)

[Category list / nav] --enables--> [Search / filter] --enables--> [Watchlist] --enables--> [Threshold alerts]

[Public JSON API] --is exposed by--> [Normalized data layer]   (near-free once layer exists)
```

### Dependency Notes

- **Everything requires the normalized data layer + cached JSON API.** This is the first thing to build; it's the seam that lets mock/seed data swap for real Renaiss sources later without touching UI or the risk engine. Build it first, well.
- **Risk-scored index requires both the index chart AND the risk breakdown.** Neither alone is the innovation; the *pairing on one category* is. Sequence both, then compose.
- **Confidence bands extend the index/score and precede "insufficient data."** They're the same statistical idea at different severities: wide band (some data) → no estimate (too little). Build the band logic and the cutoff falls out of the same sample-size function.
- **Source label + freshness is a cross-cutting attachment, not a screen.** Bake it into the shared "metric panel" component so every number inherits it — cheapest way to blanket the app with Clarity/Safety.
- **Watchlist → threshold alerts is the natural chain,** but alerts can technically stand alone (evaluate against all categories). Watchlist gives alerts a home; do watchlist first if pulling in either.
- **Search/filter, watchlist, alerts all hang off category nav** and are independent of the risk/index core — safe to defer wholesale without destabilizing the demo.
- **Public JSON API conflicts with nothing** and is emergent from the data layer — lowest-risk ecosystem point on the board.

---

## MVP Definition

### Launch With (v1 — DEMO-CRITICAL)

The 60–90s walkthrough (open → read overview → drill into a category index → expand risk factors + source → show "insufficient data"). Every item below is load-bearing for that script.

- [ ] **Normalized data layer + cached JSON API** — foundation; the swap-in seam and the demo's reliability guarantee.
- [ ] **Market overview KPIs** (total listings, volume, top movers) — the "at a glance" opening beat.
- [ ] **Per-category index chart** (base=100, volume-weighted, 3–5 categories, time-range toggle) — the core drill-in object.
- [ ] **Category detail view** (floor, volume, recent sales, risk factors) — the "drill into one" beat.
- [ ] **Risk score + visible factor breakdown** — the Innovation + Clarity centerpiece.
- [ ] **Confidence bands** on index/score — encodes trust visually; core to Safety framing and cheap given the data layer.
- [ ] **Source label + freshness timestamp** on every metric — the trust primitive; makes mock data honest.
- [ ] **"Insufficient data" state** — scripted safety beat; proves the design on purpose.
- [ ] **Responsive terminal-style layout + category nav** — the shell everything lives in.

### Add After Validation (v1.x — SHOULD-HAVE, pull in if time)

Add in this order; each is independent and low-risk.

- [ ] **Public JSON API endpoints (documented)** — trigger: data layer done and stable; near-free Ecosystem points. *Do this first of the should-haves.*
- [ ] **Search / filter across categories** — trigger: >5 categories or spare polish time; pure client-side.
- [ ] **Saved watchlist (localStorage)** — trigger: search shipped; demonstrates personalization-without-accounts.
- [ ] **Simple in-app threshold alerts** — trigger: watchlist shipped; adds the trader "signal" story.
- [ ] **Mover ↔ risk-shift tie-in on the index** — trigger: any leftover time; cheap narrative upgrade ("up but riskier").

### Future Consideration (v2+ — explicitly deferred)

- [ ] **Real Renaiss data source integration** — deferred: unresolved CTO/API question; the data-layer seam exists precisely so this drops in later.
- [ ] **Per-item / sub-category granularity** — deferred: multiplies data + UI; Tessera's unit is the category.
- [ ] **Operator digests / scheduled market-health reports** — deferred: valuable for operators but needs delivery infra; v1 shows the live operator read instead.
- [ ] **Cross-category correlation / relative-value views** — deferred: nice analytical depth, not needed to prove the concept.
- [ ] **Persistent/multi-device watchlists** — deferred: requires accounts (an anti-feature in v1).

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Normalized data layer + cached JSON API | HIGH | MEDIUM | P1 |
| Market overview KPIs (listings/volume/top movers) | HIGH | LOW | P1 |
| Per-category index chart (base=100) | HIGH | MEDIUM | P1 |
| Category detail view (floor/volume/sales/risk) | HIGH | MEDIUM | P1 |
| Risk score + factor breakdown | HIGH | MEDIUM | P1 |
| Confidence bands | HIGH | MEDIUM | P1 |
| Source label + freshness timestamp | HIGH | LOW | P1 |
| "Insufficient data" state | HIGH | LOW | P1 |
| Responsive layout + category nav | HIGH | LOW | P1 |
| Public JSON API (documented endpoints) | MEDIUM | LOW | P2 |
| Search / filter | MEDIUM | LOW | P2 |
| Saved watchlist (localStorage) | MEDIUM | LOW | P2 |
| Threshold alerts (in-app) | MEDIUM | MEDIUM | P2 |
| Mover ↔ risk-shift tie-in | MEDIUM | LOW | P2 |
| Wallet / trading | (anti-feature) | HIGH | — |
| Auth / accounts | (anti-feature) | MEDIUM | — |
| Real-time streaming | (anti-feature) | HIGH | — |
| ML/black-box risk model | (anti-feature) | HIGH | — |

**Priority key:**
- P1: Must have for the demo (DEMO-CRITICAL)
- P2: Should have, add when possible (SHOULD-HAVE)
- —: Deliberately not built (anti-feature) or v2+

---

## Competitor Feature Analysis

| Feature | NFT analytics (NFTPriceFloor / DappRadar / Nansen) | Physical collectibles (Card Ladder / Market Movers / VCP) | Tessera's Approach |
|---------|-----------------------------------------------------|-----------------------------------------------------------|--------------------|
| Market overview | Top collections by floor/volume/market cap; trending | Market summary + top movers, daily-updated | Compact KPI header + top-movers table over normalized categories |
| Price index over time | Floor-price charts per collection (not always normalized) | **Normalized indexes** (CL50, player/era indexes; S&P/Dow-style weighting) | Volume-weighted, base=100 per category — closer to Card Ladder than to raw floor charts |
| Risk / quality signal | Wash-trade flags, liquidity, volatility (often opaque, whale-focused) | Largely absent; price/volume only | **Transparent, deterministic risk score with a visible factor breakdown** — the fusion is Tessera's edge |
| Data provenance | Multi-chain source labels; "real-time" claims | "Data from top marketplaces, updated daily" | **Explicit source chip + freshness timestamp on every metric**, honest about mock/seed origin |
| Confidence / uncertainty | Rare (mostly point numbers) | Rare (point estimates) | **Confidence bands + "insufficient data" state** (AVM-style discipline) — a genuine differentiator vs both camps |
| Watchlist / alerts | Star + price alerts (require accounts) | Portfolio tracking (requires accounts) | Local-only watchlist + in-app threshold alerts, **no accounts / no PII** |
| Trading / execution | Blur, marketplaces (order books, depth) | Marketplace links / buy | **None** — read-only intelligence by design |
| Public API | Some (paid tiers) | Limited | **Clean, free, documented read-only JSON** — ecosystem-reusable |

Takeaway: the physical-collectibles camp nails *normalized indexes* but ignores *risk*; the NFT camp has *risk-ish signals* but they're *opaque and often gated*. **Tessera's whitespace is a transparent, confidence-banded, source-labeled risk-scored index — the honesty layer neither camp ships.**

## Sources

- NFT analytics feature landscape — [NFTPriceFloor](https://nftpricefloor.com/), [CoinGecko NFT](https://www.coingecko.com/en/nft), [DailyCoin: 12 NFT analytics tools](https://dailycoin.com/nft-portfolio-best-12-analytics-tools-to-track-nfts-projects/), [Synodus: NFT analytics tools](https://synodus.com/blog/blockchain/nft-analytics-tools/), [SimpleHash analytics](https://simplehash.com/use-cases/analytics) (floor/volume/top-movers, per-collection pages, Blur market depth)
- Physical collectibles pricing/index tools — [Card Ladder](https://www.cardladder.com/), [Market Movers](https://www.marketmoversapp.com/), [Vintage Card Prices](https://vintagecardprices.com/), [PSA Price Guide](https://www.psacard.com/priceguide), [SportsCardsPro collection tracker](https://www.sportscardspro.com/page/collection-tracker) (indexes, price guides, portfolio tracking, alerts)
- Index construction methodology — [Card Ladder: CL50](https://cardladder.zendesk.com/hc/en-us/articles/11943112663063-What-is-the-CL50), [Card Ladder: What are Indexes](https://cardladder.zendesk.com/hc/en-us/articles/11943014102167-What-are-Indexes), [Destiny Family Office: Collectible indices](https://destinyfamilyoffice.com/collectible-indices-what-are-they-and-which-ones-can-collectors-use-to-track-markets/) (S&P/Dow-style weighting, inclusion criteria, base-period normalization)
- Risk scoring / wash-trading / rarity methodology — [NFT Scoring (ACM)](https://dl.acm.org/doi/fullHtml/10.1145/3581971.3581979), [Wash-trading detection (Springer Financial Innovation)](https://link.springer.com/article/10.1186/s40854-025-00766-z), [Understanding NFT rarity scoring (Gate)](https://web3.gate.com/crypto-wiki/article/understanding-nft-rarity-scoring-systems-explained-20251212) (liquidity/time-to-sale/volatility factors; discount-not-exclude suspect volume)
- Confidence intervals + "insufficient data" discipline — [IAAO Standard on AVMs](https://www.iaao.org/wp-content/uploads/Standard_on_Automated_Valuation_Models.pdf), [Xome: Why confidence scores matter](https://www.xome.com/blog/why-confidence-scores-matter-in-automated-valuation-models/), [AmeriSave: AVMs in 2026](https://www.amerisave.com/glossary/automated-valuation-models-in-how-avms-work-their-limits-and-what-they-mean-for-your-mortgage) (thin markets → wider bands / no estimate; confidence thresholds)
- Terminal UX conventions — [Bloomberg Terminal (Wikipedia)](https://en.wikipedia.org/wiki/Bloomberg_Terminal), [How Bloomberg Terminal UX conceals complexity](https://www.bloomberg.com/company/stories/how-bloomberg-terminal-ux-designers-conceal-complexity/) (multi-panel layout, global-macro-movers heatmap, watchlist analytics)
- Watchlist / alerts conventions — [CoinGecko price alerts & portfolio](https://www.coingecko.com/learn/coingecko-crypto-price-alerts-portfolio), [Robinhood price alerts](https://robinhood.com/us/en/support/articles/price-alerts/) (star-to-watchlist, threshold-crossing alerts)

---
*Feature research for: collectibles market-intelligence / trading-terminal dashboard (Tessera)*
*Researched: 2026-07-05*
