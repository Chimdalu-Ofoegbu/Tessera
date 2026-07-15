// Regenerates public/api/*.json from the LIVE Renaiss Index API so every production
// build ships current data instead of a hand-frozen snapshot.
//
// Reuses the exact compute layer the prod /api handlers use (buildOverview /
// buildCategoryAnalytics over the real RenaissSource), so the generated shapes are
// guaranteed to match what the frontend consumes.
//
// FAILS SAFE — it never breaks a build:
//   * live source not enabled (local dev)      -> skip, keep the committed snapshot
//   * Renaiss down / rate-limited / times out  -> keep the committed snapshot, exit 0
//   * only writes when the FULL set fetched + validated as genuinely live (all-or-nothing)
//
// Runs live on Vercel production builds automatically (VERCEL_ENV=production), or on
// demand with `pnpm gen:snapshot` (passes --live). Local `pnpm build` skips it, so it
// never burns the public tier's 10-requests/day quota during development.
import { createServer } from 'vite'
import { writeFile, mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'api')

const forced = process.argv.includes('--live')
const hasCreds = Boolean(process.env.RENAISS_API_KEY && process.env.RENAISS_API_SECRET)
const live = forced || process.env.USE_RENAISS === '1' || process.env.VERCEL_ENV === 'production' || hasCreds

if (!live) {
  console.log('[gen-snapshot] live refresh not enabled (use --live / USE_RENAISS=1 / VERCEL_ENV=production / partner creds) — keeping committed snapshot.')
  process.exit(0)
}

// Point the single data-source wiring at RenaissSource for this run.
process.env.USE_RENAISS = '1'

async function generate() {
  const server = await createServer({ root: ROOT, appType: 'custom', server: { middlewareMode: true }, logLevel: 'error' })
  try {
    const { getDataSource } = await server.ssrLoadModule('/src/data/getDataSource.ts')
    const { buildOverview, buildCategoryAnalytics } = await server.ssrLoadModule('/src/lib/compute.ts')
    const source = getDataSource()
    const now = Date.now()

    const overview = await buildOverview(source, now)
    const health = await source.health()

    // Accept ONLY genuinely-live, non-empty data. Anything else -> throw -> keep committed snapshot.
    if (overview?.source !== 'renaiss') throw new Error(`overview.source='${overview?.source}' (expected 'renaiss')`)
    if (health?.source !== 'renaiss') throw new Error(`health.source='${health?.source}' (expected 'renaiss')`)
    const categories = Array.isArray(overview.categories) ? overview.categories : []
    if (categories.length === 0) throw new Error('live overview returned zero categories')

    const ids = categories.map((c) => c.id)
    const detail = {}
    for (const id of ids) detail[id] = await buildCategoryAnalytics(source, id, now)

    // All fetched + validated -> write the FULL set (no partial snapshot).
    await mkdir(path.join(OUT, 'categories'), { recursive: true })
    await mkdir(path.join(OUT, 'index'), { recursive: true })

    const files = {
      'overview.json': overview,
      'categories.json': { categories: overview.categories },
      'health.json': health,
    }
    for (const id of ids) {
      files[`categories/${id}.json`] = detail[id]
      // Match the /api/index/:id handler contract: rebased basis is always 100.
      files[`index/${id}.json`] = { id, base: 100, window: 365, indexSeries: detail[id].indexSeries }
    }
    for (const [rel, body] of Object.entries(files)) {
      await writeFile(path.join(OUT, rel), JSON.stringify(body))
    }

    // Prune per-category files for games no longer live — keeps the snapshot in lockstep
    // with the live index list (so a dropped/added Renaiss game is reflected automatically).
    for (const sub of ['categories', 'index']) {
      for (const f of await readdir(path.join(OUT, sub))) {
        if (f.endsWith('.json') && !ids.includes(f.replace(/\.json$/, ''))) {
          await rm(path.join(OUT, sub, f))
        }
      }
    }

    console.log(`[gen-snapshot] wrote LIVE snapshot — ${ids.length} categories [${ids.join(', ')}] · asOf ${overview.asOf}`)
  } finally {
    await server.close()
  }
}

generate()
  .then(() => process.exit(0))
  .catch((err) => {
    // Never break the build — fall back to the committed snapshot.
    console.warn(`[gen-snapshot] live refresh FAILED — keeping committed snapshot. Reason: ${err?.message ?? err}`)
    process.exit(0)
  })
