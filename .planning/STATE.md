# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-05)

**Core value:** A judge or collector can open Tessera, understand the collectible market at a glance, and trust the numbers because every source, timestamp, and confidence band is visible — then drill into one category — all without explanation.
**Current focus:** Phase 6 — Deploy, Demo & Submission (with the user)

## Current Position

Phase: 6 of 6 (Deploy, Demo & Submission)
Plan: —
Status: **DEPLOYED & LIVE ON REAL RENAISS DATA → https://tessera-terminal.vercel.app** (Vercel prod; static `/api/*.json` snapshot **generated from the live Renaiss Index API** — 2 categories, every metric `source: renaiss`, risk 8/11 scored, index base 100; deep-links + SPA rewrite verified). App complete (Phases 1–5) + shipped (SHIP-01). Remaining SHIP-02 items are the user's: record the 60–90s clip + push to a public GitHub repo.
Last activity: 2026-07-08 — Completed quick task 260708-nmm: production cut over to live Renaiss data (mapper n-fallback fix so real series score; index-endpoint base fix; 7D/floor-value/source-label honesty pass; snapshot regenerated ≤8/10 rate budget; live-verified via API + browser). (Prior: 260708-kg5 light-only UI; 260708-hoh responsive fixes.)

Progress: [█████████░] ~95% (deployed; demo recording + public-repo push remain)

## Performance Metrics

**Velocity:**
- Total plans completed: 8 (Phases 1–3); 48 tests passing
- Execution model: orchestrator executes plans inline (write-heavy GSD executor subagents stall on this Windows env — see memory `tessera-execute-directly`); read-heavy subagents (research/plan-check/verify) run fine

**By Phase:**

| Phase | Plans | Status | Notes |
|-------|-------|--------|-------|
| 1 — Data Layer & Metric Contract | 4/4 | ✓ verified | 25 tests, DATA-01/02/03 + PROV-02 |
| 2 — Analytics Engines (Risk + Index) | 2/2 | ✓ verified | 13 core tests, IDX-02/03 + RISK-03/05 |
| 3 — API & Cache | 2/2 | ✓ done | API-01 + SHIP-01 (config); runtime handler tests |

**Recent Trend:**
- Last plans: 01-01 scaffold, 01-02 metric envelope, 01-03 MockSource, 01-04 Renaiss adapter
- Trend: green (tsc/vitest/build exit 0 throughout)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. Recent decisions affecting current work:

- Consume the real Renaiss Index API as the substrate; Tessera's compute is the RISK score Renaiss doesn't provide ("Renaiss gives the price; Tessera adds the risk lens").
- Mock/seed data behind the `DataSource` seam is the demo-safe default; real source opt-in via `USE_RENAISS=1`; swap is one wiring point (`getDataSource`).
- Every metric carries a `{ value | insufficient, confidence, sampleSize, source, asOf }` envelope — a bare/unsourced number is impossible by type. `INSUFFICIENT_DATA` is first-class.
- Frontend built externally in Claude Design (brief: `tessera-ui-design-prompt.md`), handed off and wired here.

### Pending Todos

None.

### Blockers/Concerns

- None. Phase 2 methodology resolved + verified (see `02-METHODOLOGY.md`; engines `risk@1.0.0` / `index@1.0.0`). Phase 4/5 frontend is gated on the user's Claude Design handoff.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260708-hoh | Responsive fixes: nav collapse + detail sales-table overflow (mobile/tablet) | 2026-07-08 | e3006bc | [260708-hoh-responsive-fixes-nav-collapse-detail-sal](./quick/260708-hoh-responsive-fixes-nav-collapse-detail-sal/) |
| 260708-kg5 | Strict light mode; remove theme toggle (terminal + drawer light-only) | 2026-07-08 | 5ccddad | [260708-kg5-strict-light-mode-remove-theme-toggle](./quick/260708-kg5-strict-light-mode-remove-theme-toggle/) |
| 260708-nmm | Fully live on Renaiss (real snapshot, n-fallback mapper fix, 7D/floor-value label honesty; gitignore already covered) | 2026-07-08 | c658fe5+371dbe9+1125728 | [260708-nmm-gitignore-design-assets-go-fully-live-on](./quick/260708-nmm-gitignore-design-assets-go-fully-live-on/) |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Data layer | `RenaissSource.getRecentSales` uses the cross-card feed; per-category filtering | Phase 3 refinement | Phase 1 |
| Frontend | Real UI (Overview + Category Detail) | External Claude Design handoff → wired Phase 4/5 | Phase 1 |

## Session Continuity

Last session: 2026-07-06
Stopped at: **Backend complete (Phases 1–3).** Data layer + risk/index engines + cached JSON API (`/api/overview`, `/api/categories`, `/api/categories/:id`, `/api/index/:id`, `/api/health`); 48 tests; all gates green. Next: Phase 4/5 frontend integration — **gated on the user pointing to their exported Claude Design handoff folder**. Then Phase 6 deploy/demo (with user).
Resume file: None
