# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-05)

**Core value:** A judge or collector can open Tessera, understand the collectible market at a glance, and trust the numbers because every source, timestamp, and confidence band is visible — then drill into one category — all without explanation.
**Current focus:** Phase 6 — Deploy, Demo & Submission (with the user)

## Current Position

Phase: 6 of 6 (Deploy, Demo & Submission)
Plan: —
Status: **SUBMITTED ✓** — live at https://www.tesseraindex.xyz on real Renaiss Index data; public repo https://github.com/Chimdalu-Ofoegbu/Tessera (clean history, private folders excluded); hackathon submission completed 2026-07-09. All 23 v1 requirements complete.
Last activity: 2026-07-12 — Completed quick task 260712-7db: added the Tessera product favicon (brand-diamond SVG + theme-color) to replace the browser-tab placeholder. Post-submission polish; not yet deployed.

Progress: [██████████] 100% — submitted

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
| 260709-3au | Hero: count-aware 3D card layout (2 live cards → mid-height flanks, larger; narrow → bottom pair; ≥5 unchanged) | 2026-07-09 | bd2d101 | [260709-3au-hero-count-aware-card-layout-2-live-card](./quick/260709-3au-hero-count-aware-card-layout-2-live-card/) |
| 260709-3jy | Close hero ticker → footer gap (footer marginTop 56 → 0) | 2026-07-09 | cc81e3b | [260709-3jy-close-hero-ticker-to-footer-gap](./quick/260709-3jy-close-hero-ticker-to-footer-gap/) |
| 260709-4d6 | Remove vercel.app link from README (custom domain only) | 2026-07-09 | (docs) | quick/260709-4d6 |
| 260709-4p6 | Hero copy: drop eight-indices claim + adaptive K/M format; 4K hero screenshot captured | 2026-07-09 | dc75dca | quick/260709-4p6 |
| 260712-7db | Add Tessera product favicon (brand-diamond `public/favicon.svg` on cream plaque) + wire icon + theme-color into index.html | 2026-07-12 | 1846364 | [260712-7db-add-tessera-product-favicon-public-favic](./quick/260712-7db-add-tessera-product-favicon-public-favic/) |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Data layer | `RenaissSource.getRecentSales` uses the cross-card feed; per-category filtering | Phase 3 refinement | Phase 1 |
| Frontend | Real UI (Overview + Category Detail) | External Claude Design handoff → wired Phase 4/5 | Phase 1 |

## Session Continuity

Last session: 2026-07-06
Stopped at: **Backend complete (Phases 1–3).** Data layer + risk/index engines + cached JSON API (`/api/overview`, `/api/categories`, `/api/categories/:id`, `/api/index/:id`, `/api/health`); 48 tests; all gates green. Next: Phase 4/5 frontend integration — **gated on the user pointing to their exported Claude Design handoff folder**. Then Phase 6 deploy/demo (with user).
Resume file: None
