# 01-01 — Project Scaffold & Tooling — SUMMARY

**Status:** Complete
**Requirements:** DATA-01 (foundation)

## What shipped

A minimal, compiling Vite + React 19 + TypeScript SPA installed with pnpm, with a committed lockfile, the ports-and-adapters directory skeleton, a Vercel SPA rewrite, and secret-safe env scaffolding. `pnpm install`, `pnpm build`, and `pnpm test` all exit 0.

## Versions installed (from pnpm-lock.yaml — match STACK.md exactly)

| Package | Version |
|---------|---------|
| react / react-dom | 19.2.7 |
| vite | 8.1.3 |
| typescript | 6.0.3 |
| @vitejs/plugin-react-swc | 4.3.1 |
| vitest / @vitest/coverage-v8 | 4.1.9 |
| zod | 4.4.3 |
| @tanstack/react-query | 5.101.2 |
| @types/node | 24.13.2 |

## Directory skeleton (boundaries reserved)

- `src/core/` — pure logic, NO I/O (Phase 2 engines)
- `src/data/` — the DataSource seam + fixtures + adapters (Phase 1)
- `api/` — Vercel functions (Phase 3, reserved only)
- `@/*` path alias → `./src/*` (in `tsconfig.json` + `vite.config.ts`)

## Deviations from PLAN.md (documented)

1. **Lean scaffold — deferred Tailwind, shadcn/ui, and recharts to the frontend-integration phase.** The production UI is built externally in Claude Design and handed off (per user direction + `tessera-ui-design-prompt.md`), so this scaffold only needs to compile and host the data layer / `/api` functions. Adding UI libraries now would risk conflicting with the handoff's own styling. `App.tsx` is a placeholder. TanStack Query is kept (installed + provider wired) for the later wiring.
2. **Single `tsconfig.json`** (build = `tsc && vite build`) instead of the 3-project-reference split — simpler and avoids composite/noEmit friction; same strictness.
3. **Hand-written scaffold** instead of `pnpm create vite` — the `--template react-swc-ts` flag was not honored via pnpm in this environment (kept producing the vanilla template) and the temp dir got OS-locked. Hand-writing was deterministic. A stray, OS-locked `_scaffold/` temp dir remains (gitignored; delete later).
4. **`--passWithNoTests`** added to the `test` script so Vitest 4 exits 0 on an empty suite (its default is exit 1).
5. **Removed `baseUrl`** (deprecated in TS 6.0; `paths` now resolves relative to `tsconfig.json`).
6. **Approved `@swc/core` native postinstall** via `pnpm.onlyBuiltDependencies` so the SWC React plugin builds.

## Verification

- `pnpm install` → exit 0, `pnpm-lock.yaml` committed.
- `pnpm build` → exit 0 (`tsc` clean, `dist/` produced, 63 modules).
- `pnpm test` → exit 0 (Vitest wired; 0 tests for now, real tests land in 01-02+).
- `vercel.json` SPA rewrite present; `.gitignore` protects `.env*` (keeps `.env.example` + lockfile); `.env.example` documents the three Renaiss keys with blank placeholders; no `rk_`/`rsk_` token in the tree.
