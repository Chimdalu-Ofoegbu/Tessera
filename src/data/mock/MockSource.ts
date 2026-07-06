import type { DataSource, Health, Mover } from '../DataSource'
import type { Category, CategoryDetail, PricePoint, Sale, Window } from '../schema'
import { ok, insufficient, isOk, type Metric, type Provenance } from '../metric'
import { MIN_SAMPLE } from '../../core/thresholds'
import { SEED_BY_ID, SEED_IDS, toTile, toDetail, AS_OF, type Seed } from '../fixtures'

const DAY = 86_400_000

const seriesProv = (s: Seed, sampleSize: number): Provenance => ({
  source: 'seed',
  asOf: AS_OF,
  confidence: s.index.provenance.confidence,
  sampleSize,
})

/**
 * Serves the seed fixtures behind the DataSource port. Every value is
 * provenance-wrapped (`source: 'seed'`); thin data returns the insufficient
 * branch rather than a fabricated number.
 */
export class MockSource implements DataSource {
  async getCategories(): Promise<Category[]> {
    return SEED_IDS.map((id) => toTile(SEED_BY_ID[id]))
  }

  async getCategory(id: string): Promise<CategoryDetail> {
    const s = SEED_BY_ID[id]
    if (!s) throw new Error(`Unknown category: ${id}`)
    return toDetail(s)
  }

  async getIndexSeries(id: string, window: Window): Promise<Metric<PricePoint[]>> {
    const s = SEED_BY_ID[id]
    if (!s) throw new Error(`Unknown category: ${id}`)
    const cutoff = Date.parse(AS_OF) - window * DAY
    const pts = s.series.filter((p) => Date.parse(p.t) >= cutoff)
    const p = seriesProv(s, pts.length)
    // Thin window OR a category whose index is already insufficient → no fabricated series.
    if (pts.length < MIN_SAMPLE || !isOk(s.index)) return insufficient(p)
    return ok(pts, p)
  }

  async getRecentSales(id: string, limit = 10): Promise<Sale[]> {
    const s = SEED_BY_ID[id]
    if (!s) throw new Error(`Unknown category: ${id}`)
    return s.sales.slice(0, limit)
  }

  async getFeaturedMovers(limit = 6): Promise<Mover[]> {
    return SEED_IDS.map((id) => SEED_BY_ID[id])
      .filter((s) => isOk(s.index))
      .sort((a, b) => Math.abs(b.deltas.d7 ?? 0) - Math.abs(a.deltas.d7 ?? 0))
      .slice(0, limit)
      .map((s) => ({ id: s.id, label: s.label, deltaPct: s.deltas.d7, index: s.index }))
  }

  async health(): Promise<Health> {
    return { ok: true, source: 'seed' }
  }
}
