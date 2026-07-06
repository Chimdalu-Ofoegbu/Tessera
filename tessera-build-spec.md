# Tessera — Build Spec

*Collector market-intelligence dashboard for the Renaiss ecosystem.*
*Renaiss Tech Hackathon S1 · Tool track · Build window Jul 4–11, 2026*
*Prepared for CTO coaching session (Jul 1–2) with Benjamin Tong.*

---

## 1. One-liner

A "Bloomberg terminal lite" for real-world collectibles on Renaiss: floors, volume, and category indices in one readable view, each with a transparent, clearly-sourced risk score.

## 2. Problem

Collectible markets are opaque and fragmented. Pricing signal is scattered across listings, and risk is unquantified — which throttles the liquidity that is Renaiss's core mission. Collectors, traders, and operators have no single trusted dashboard to price, compare, and gauge risk.

## 3. Users

- **Collectors** — check fair value and category trends before buying/selling.
- **Traders** — spot momentum, volume spikes, and risk shifts across categories.
- **Community operators** — monitor market health, share digests, inform listings.

## 4. Scope (one-week build)

**Must have (v1 demo)**
- Market overview: total listings, volume, top movers.
- Per-category index (price level over time) for 3–5 collectible categories.
- Per-category **risk score** with a visible breakdown (no black box).
- Detail view: one category → floor, volume, recent sales, risk factors.
- Every metric labeled with its data source and freshness timestamp.

**Should have (if time allows)**
- Search/filter across categories.
- Saved watchlist (in-memory or local).
- Simple alerts (threshold crossed) shown in-app.

**Won't do (v1)**
- Wallet connection / transactions / trading execution.
- Auth, accounts, or any private user data.
- Mobile-native build (responsive web only).

## 5. Architecture (proposed — to confirm in coaching)

- **Frontend:** single-page web app (React + a chart lib), responsive.
- **Backend:** lightweight indexer/aggregator → normalizes Renaiss data → serves a small JSON API. Cache reads.
- **Data layer:** pulls from approved Renaiss source(s) [SDK/API/indexer — *open question, see §8*]; falls back to clearly-labeled mock/seed data so the demo is never blocked.
- **Risk engine:** deterministic scoring function (see §6), versioned and explainable.

## 6. Index & risk-score methodology (draft — validate with CTO)

- **Category index:** volume-weighted average price of a category's collectibles, normalized to a base period (index = 100 at start).
- **Risk score (0–100), composite of transparent factors:**
  - *Liquidity* — listing depth / trade frequency.
  - *Volatility* — price dispersion over the window.
  - *Concentration* — share of volume in a few items/holders.
  - *Data confidence* — sample size / freshness penalty when thin.
- **Safety rule:** the score is shown with its factor breakdown and a confidence band, never as a verified valuation. Thin data renders as "insufficient data," not a fabricated number.

## 7. Judging alignment (Renaiss criteria)

- **Usability** — one readable dashboard a collector can actually use.
- **Innovation** — risk-scored *index* for collectibles, not just a price list.
- **Ecosystem relevance** — directly serves Renaiss's authenticity/liquidity/culture mission.
- **Clarity** — labeled sources, timestamps, explainable scores.
- **Safety** — no private data; AI/derived outputs carry caveats and confidence.

## 8. Open questions for the CTO (priority order)

1. **Data access** — What approved Renaiss data exists for floors, volume, listings, and historical sales? Is there an API/SDK/indexer to build against, or should v1 run on labeled public/mock data?
2. **Categories** — Which collectible categories should v1 prioritize for the most credible demo?
3. **Risk methodology** — Are the proposed risk factors sound for Renaiss assets? Anything to add/drop?
4. **Index definition** — Preferred weighting (volume vs. equal vs. cap-weighted)?
5. **Safety/data handling** — Any data that must not be surfaced; required caveats or disclaimers.
6. **Reusability** — Would a clean public JSON API make Tessera more useful to other builders (bonus ecosystem points)?

## 9. Milestones (Jul 4–11)

- **Jul 4–5** — Data layer + mock/seed dataset; confirm schema. End state: API returns category + index data.
- **Jul 6–7** — Index + risk engine; unit-test the scoring on known cases.
- **Jul 8–9** — Frontend: overview + category detail + charts.
- **Jul 10** — Source labels, timestamps, confidence states, polish.
- **Jul 11** — Demo script, screenshots/GIF, submission. Buffer for bugs.

## 10. Demo plan

A 60–90s walkthrough: open dashboard → read the market overview → drill into one category index → expand the risk score to show its factors and data source → highlight an "insufficient data" state to prove the safety design. Recorded as a short clip plus a live link.

## 11. Success criteria

A judge can open Tessera, understand the collectible market at a glance, trust the numbers (because sources and confidence are visible), and drill into one category — all without explanation.
