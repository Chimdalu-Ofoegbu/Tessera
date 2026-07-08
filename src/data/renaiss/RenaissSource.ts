import type { DataSource, Health, Mover } from '../DataSource'
import type { Category, CategoryDetail, PricePoint, Sale, Window } from '../schema'
import { insufficient, isOk, ok, type Metric } from '../metric'
import { MIN_SAMPLE } from '../../core/thresholds'
import { renaissGet, RateLimitError } from './client'
import {
  mapConstituent,
  mapIndexTileToCategory,
  mapProvenance,
  mapSeriesPoint,
  mapTradeToSale,
  type RawIndexDetail,
  type RawIndexTile,
  type RawTrade,
} from './map'

const DAY = 86_400_000

/**
 * The real adapter — implements the same DataSource port as MockSource, over
 * `https://api.renaissos.com/v1/*`. Maps confidence/freshness into the provenance
 * envelope and degrades gracefully (empty list / insufficient) on rate-limit or
 * network failure, so a live demo is never blocked. Selected only via getDataSource().
 */
export class RenaissSource implements DataSource {
  async getCategories(): Promise<Category[]> {
    const now = Date.now()
    try {
      const raw = (await renaissGet('/v1/indices')) as { indices?: RawIndexTile[] } | RawIndexTile[]
      const tiles = Array.isArray(raw) ? raw : raw.indices ?? []
      return tiles.map((t) => mapIndexTileToCategory(t, now))
    } catch {
      return []
    }
  }

  async getCategory(id: string): Promise<CategoryDetail> {
    const now = Date.now()
    const raw = (await renaissGet(`/v1/indices/${encodeURIComponent(id)}`)) as RawIndexDetail
    const tile = mapIndexTileToCategory(raw, now)
    const constituents = (raw.constituents ?? []).map((c) => mapConstituent(c, now))
    const recentSales = (raw.recentTrades ?? raw.trades ?? []).map(mapTradeToSale)
    return { ...tile, constituents, recentSales }
  }

  async getIndexSeries(id: string, window: Window): Promise<Metric<PricePoint[]>> {
    const now = Date.now()
    try {
      const raw = (await renaissGet(`/v1/indices/${encodeURIComponent(id)}`)) as RawIndexDetail
      const category = mapIndexTileToCategory(raw, now)
      const prov = mapProvenance(raw.constituentCount ?? 0, raw.updatedAt, now)
      if (!isOk(category.index)) return insufficient(prov)
      const all = (raw.sparkline ?? []).map((p) => mapSeriesPoint(p, raw.constituentCount ?? 0))
      const cutoff = now - window * DAY
      const windowed = all.filter((p) => Date.parse(p.t) >= cutoff)
      const use = windowed.length >= MIN_SAMPLE ? windowed : all
      return use.length >= MIN_SAMPLE ? ok(use, prov) : insufficient(prov)
    } catch (e) {
      if (e instanceof RateLimitError) return insufficient(mapProvenance(0, null, now))
      throw e
    }
  }

  async getRecentSales(id: string, limit = 10): Promise<Sale[]> {
    void id // the recent-trades feed is cross-card; per-category filtering is a later refinement
    try {
      const raw = (await renaissGet(`/v1/trades/recent?limit=${limit}`)) as { trades?: RawTrade[] } | RawTrade[]
      const trades = Array.isArray(raw) ? raw : raw.trades ?? []
      return trades.map(mapTradeToSale).slice(0, limit)
    } catch {
      return []
    }
  }

  async getFeaturedMovers(limit = 6): Promise<Mover[]> {
    const cats = await this.getCategories()
    return cats
      .filter((c) => isOk(c.index))
      .slice(0, limit)
      .map((c) => ({ id: c.id, code: c.code, label: c.label, deltaPct: c.change24h, change24h: c.change24h, index: c.index }))
  }

  async health(): Promise<Health> {
    try {
      const h = (await renaissGet('/v1/health')) as { ok?: boolean }
      return { ok: Boolean(h.ok), source: 'renaiss' }
    } catch {
      return { ok: false, source: 'renaiss' }
    }
  }
}
