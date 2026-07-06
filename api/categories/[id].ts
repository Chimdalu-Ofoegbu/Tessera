import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDataSource } from '../../src/data/getDataSource'
import { buildCategoryAnalytics } from '../../src/lib/compute'

/** GET /api/categories/:id — full category detail: floor, volume, recent sales, index series, risk breakdown. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const id = String(req.query.id ?? '')
  try {
    const payload = await buildCategoryAnalytics(getDataSource(), id, Date.now())
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.setHeader('content-type', 'application/json')
    res.status(200).json(payload)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unknown category')) res.status(404).json({ error: 'unknown category', id })
    else res.status(500).json({ error: 'failed to build category' })
  }
}
