# Tessera

## What This Is

Tessera is a "Bloomberg terminal lite" for real-world collectibles in the Renaiss ecosystem. It presents floors, volume, and per-category price indices in one readable dashboard, each metric paired with a transparent, clearly-sourced risk score. It serves collectors (checking fair value before buying/selling), traders (spotting momentum and risk shifts), and community operators (monitoring market health).

## Core Value

A judge or collector can open Tessera, understand the collectible market at a glance, and **trust the numbers because every source, timestamp, and confidence band is visible** — then drill into one category — all without explanation. If everything else fails, this transparent, readable market view must work.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope (v1 demo must-haves). Building toward these. -->

- [ ] Market overview: total listings, total volume, and top movers
- [ ] Per-category price index (level over time), normalized to base = 100, for 3–5 collectible categories
- [ ] Per-category risk score (0–100) with a visible factor breakdown — no black box
- [ ] Category detail view: floor, volume, recent sales, and risk factors for one category
- [ ] Every metric labeled with its data source and freshness timestamp
- [ ] "Insufficient data" safety state that renders instead of any fabricated number when data is thin

### Should Have (deferred — pull in if time allows)

- [ ] Search / filter across categories
- [ ] Saved watchlist (in-memory or local)
- [ ] Simple in-app alerts when a threshold is crossed

### Out of Scope

<!-- Explicit boundaries with reasoning to prevent re-adding. -->

- Wallet connection, transactions, or trading execution — v1 is read-only market intelligence; no funds move
- Auth, accounts, or any private user data — reduces risk surface and matches the "no private data" safety criterion
- Mobile-native build — responsive web only within the one-week window
- Presenting the risk score as a verified valuation — safety rule: always a scored signal with a confidence band, never a guarantee

## Context

- **Event:** Renaiss Tech Hackathon S1, Tool track. Build window Jul 4–11, 2026 (currently ~day 2).
- **Mission fit:** Collectible markets are opaque and fragmented; unquantified risk throttles the liquidity that is Renaiss's core mission. Tessera gives collectors/traders/operators a single trusted dashboard to price, compare, and gauge risk.
- **Data access is an open CTO question.** Whether an approved Renaiss API/SDK/indexer exists for floors, volume, listings, and historical sales is unresolved (spec §8). v1 therefore runs on **clearly-labeled mock/seed data** behind a normalized data layer, so the demo is never blocked and real Renaiss sources can be swapped in later without reworking the UI or risk engine.
- **Judging criteria to optimize:** Usability (one readable dashboard), Innovation (a risk-scored *index*, not just a price list), Ecosystem relevance (authenticity/liquidity/culture), Clarity (labeled sources, timestamps, explainable scores), Safety (no private data; caveated, confidence-banded derived outputs).
- **Demo:** 60–90s walkthrough — open dashboard → read overview → drill into one category index → expand the risk score to show factors + source → highlight an "insufficient data" state to prove the safety design. Recorded clip + live link.

## Constraints

- **Timeline**: One-week build window (Jul 4–11, 2026) — scope must stay demo-focused; buffer reserved for bugs and submission.
- **Tech stack**: Responsive single-page web app (React + a chart library) served by a lightweight indexer/aggregator that normalizes data and serves a small cached JSON API — keeps the surface small and the demo reliable.
- **Data layer**: Pulls from an approved Renaiss source if available, else falls back to clearly-labeled mock/seed data — the demo must never be blocked on data access.
- **Risk engine**: Deterministic, versioned, and explainable scoring function — required so the score can show its factor breakdown and a confidence band rather than a black-box number.
- **Safety**: Every derived/AI output carries caveats and confidence; thin data renders as "insufficient data," never a fabricated value; no private user data is collected or surfaced.

## Key Decisions

<!-- Decisions that constrain future work. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mock/seed data first, behind a normalized data layer | Real Renaiss data access is an unresolved CTO question; the demo must never be blocked, and a clean seam lets real sources swap in later | — Pending |
| Deterministic, versioned, explainable risk engine (not ML/black box) | Judging rewards Clarity + Safety; the score must show its factors and a confidence band | — Pending |
| Volume-weighted category index normalized to 100 at a base period | Standard, defensible index construction that reads clearly on a chart | — Pending |
| Every metric carries a source label + freshness timestamp | Core to the "trust the numbers" value and the Clarity/Safety criteria | — Pending |
| Provide a clean public JSON API | Potential bonus ecosystem points; makes Tessera reusable by other builders | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-05 after initialization*
