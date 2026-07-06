# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-05)

**Core value:** A judge or collector can open Tessera, understand the collectible market at a glance, and trust the numbers because every source, timestamp, and confidence band is visible — then drill into one category — all without explanation.
**Current focus:** Phase 3 — API & Cache

## Current Position

Phase: 3 of 6 (API & Cache)
Plan: 0 of TBD in current phase
Status: Phases 1–2 complete + verified; ready to plan Phase 3
Last activity: 2026-07-06 — Phase 2 shipped & verified (risk + index engines, 2 plans, 38 tests, methodology conformance confirmed)

Progress: [███░░░░░░░] 33% (2 of 6 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 6 (Phases 1–2)
- Execution model: orchestrator executes plans inline (write-heavy GSD executor subagents stall on this Windows env — see memory `tessera-execute-directly`); read-heavy subagents (research/plan-check/verify) run fine

**By Phase:**

| Phase | Plans | Status | Notes |
|-------|-------|--------|-------|
| 1 — Data Layer & Metric Contract | 4/4 | ✓ verified | 25 tests, DATA-01/02/03 + PROV-02 |
| 2 — Analytics Engines (Risk + Index) | 2/2 | ✓ verified | 13 core tests, IDX-02/03 + RISK-03/05 |

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

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Data layer | `RenaissSource.getRecentSales` uses the cross-card feed; per-category filtering | Phase 3 refinement | Phase 1 |
| Frontend | Real UI (Overview + Category Detail) | External Claude Design handoff → wired Phase 4/5 | Phase 1 |

## Session Continuity

Last session: 2026-07-06
Stopped at: Phases 1–2 complete & verified (data layer + analytics engines; 38 tests; all gates green). Next: Phase 3 (API & cache — wire source→engines→cached JSON API in `/api`, serving the shapes the Claude Design UI expects).
Resume file: None
