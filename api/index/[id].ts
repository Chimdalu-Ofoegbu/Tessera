import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDataSource } from '../../src/data/getDataSource'
import { buildCategoryAnalytics } from '../../src/lib/compute'

/** GET /api/index/:id?window=7|30|90|365 — the category's index series (base=100, gaps for thin periods). */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const id = String(req.query.id ?? '')
  const window = Number(req.query.window ?? 365)
  try {
    const a = await buildCategoryAnalytics(getDataSource(), id, Date.now())
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.setHeader('content-type', 'application/json')
    res.status(200).json({ id: a.id, base: a.base, window, indexSeries: a.indexSeries })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unknown category')) res.status(404).json({ error: 'unknown category', id })
    else res.status(500).json({ error: 'failed to build index series' })
  }
}
