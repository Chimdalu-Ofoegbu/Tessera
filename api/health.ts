import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDataSource } from '../src/data/getDataSource'

/** GET /api/health — liveness + which data source is active (seed | renaiss). */
export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const health = await getDataSource().health()
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('content-type', 'application/json')
    res.status(200).json(health)
  } catch {
    res.status(500).json({ ok: false, error: 'health check failed' })
  }
}
