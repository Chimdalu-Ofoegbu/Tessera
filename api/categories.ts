import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDataSource } from '../src/data/getDataSource'
import { buildOverview } from '../src/lib/compute'

/** GET /api/categories — the list of category cards (index + risk chip + sparkline). */
export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const { categories } = await buildOverview(getDataSource(), Date.now())
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.setHeader('content-type', 'application/json')
    res.status(200).json({ categories })
  } catch {
    res.status(500).json({ error: 'failed to build categories' })
  }
}
