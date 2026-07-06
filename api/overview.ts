import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDataSource } from '../src/data/getDataSource'
import { buildOverview } from '../src/lib/compute'

/** GET /api/overview — market overview: totals, top movers, category cards (each with a risk chip). */
export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const payload = await buildOverview(getDataSource(), Date.now())
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.setHeader('content-type', 'application/json')
    res.status(200).json(payload)
  } catch {
    res.status(500).json({ error: 'failed to build overview' })
  }
}
