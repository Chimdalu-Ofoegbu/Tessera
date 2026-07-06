# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-05)

**Core value:** A judge or collector can open Tessera, understand the collectible market at a glance, and trust the numbers because every source, timestamp, and confidence band is visible — then drill into one category — all without explanation.
**Current focus:** Phase 2 — Analytics Engines (Risk + Index)

## Current Position

Phase: 2 of 6 (Analytics Engines — Risk + Index)
Plan: 0 of TBD in current phase
Status: Phase 1 complete + verified; ready to plan Phase 2
Last activity: 2026-07-06 — Phase 1 shipped & verified (data layer, 4 plans, 25 tests, all gates green)

Progress: [██░░░░░░░░] 17% (1 of 6 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 4 (Phase 1)
- Execution model: orchestrator executes plans inline (write-heavy GSD executor subagents stall on this Windows env — see memory `tessera-execute-directly`)

**By Phase:**

| Phase | Plans | Status | Notes |
|-------|-------|--------|-------|
| 1 — Data Layer & Metric Contract | 4/4 | ✓ verified | 25 tests, DATA-01/02/03 + PROV-02 |

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

- [Phase 2]: Three open methodology decisions must be resolved and recorded in `METHODOLOGY.md` before scores are defensible live — risk factor weights, thin-data/min-sample thresholds (`src/core/thresholds.ts` placeholders MIN_SAMPLE=5, MAX_STALE_DAYS=30), and the index base-period definition.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Data layer | `RenaissSource.getRecentSales` uses the cross-card feed; per-category filtering | Phase 3 refinement | Phase 1 |
| Frontend | Real UI (Overview + Category Detail) | External Claude Design handoff → wired Phase 4/5 | Phase 1 |

## Session Continuity

Last session: 2026-07-06
Stopped at: Phase 1 (data layer) complete & verified — 9/9 must-haves, tsc/vitest/build all exit 0. Next: plan & build Phase 2 (risk + index engines; research-flagged for methodology numbers).
Resume file: None
