/**
 * Compute/service layer — assembles the JSON API payloads. For each category it
 * pulls normalized data from the active DataSource and runs the pure risk + index
 * engines, preserving provenance on every metric (a bare number cannot appear)
 * and degrading a thin category to insufficient end-to-end. Memoized behind a
 * short TTL. This is the only place data + engines meet; the /api handlers are
 * thin wrappers over these builders.
 */
import type { DataSource, Mover } from '../data/DataSource'
import type { Category, CategoryDetail, Constituent, Money, PricePoint, Sale } from '../data/schema'
import { insufficient, isOk, ok, type Metric, type SourceId } from '../data/metric'
import { computeRisk, type RiskBreakdown } from '../core/risk'
import { buildIndex, type IndexResult } from '../core/indexEngine'
import { memo } from './cache'

const TTL = 60_000

export interface CategoryCard {
  id: string
  game: string
  label: string
  index: Metric<number>
  base: number
  deltas: Category['deltas']
  sparkline: PricePoint[]
  updatedAt: string
  constituentCount: number
  risk: Metric<RiskBreakdown>
}
export interface CategoryAnalytics extends CategoryCard {
  constituents: Constituent[]
  recentSales: Sale[]
  floor: Metric<Money>
  volume: Money
  indexSeries: Metric<IndexResult>
}
export interface Overview {
  totalListings: number
  totalVolume: Money
  topMovers: Mover[]
  categories: CategoryCard[]
  source: SourceId
  asOf: string
}

async function rawSeriesFor(source: DataSource, id: string, detail: CategoryDetail): Promise<PricePoint[]> {
  const s = await source.getIndexSeries(id, 365)
  return isOk(s) ? s.value : detail.sparkline
}

export async function buildCategoryAnalytics(source: DataSource, id: string, now: number): Promise<CategoryAnalytics> {
  return memo(`analytics:${id}`, TTL, now, async () => {
    const detail = await source.getCategory(id)
    const rawSeries = await rawSeriesFor(source, id, detail)
    const prov = detail.index.provenance
    const constituentValuesCents = detail.constituents
      .map((c) => (isOk(c.price) ? c.price.value.cents : 0))
      .filter((v) => v > 0)

    const risk = computeRisk({
      series: rawSeries,
      constituentValuesCents,
      sampleSize: prov.sampleSize,
      confidence: prov.confidence,
      asOf: prov.asOf,
      source: prov.source,
      now,
    })
    const indexSeries = buildIndex({
      series: rawSeries,
      source: prov.source,
      asOf: prov.asOf,
      confidence: prov.confidence,
      sampleSize: prov.sampleSize,
    })

    const pricedCents = detail.constituents
      .map((c) => (isOk(c.price) ? c.price.value.cents : Number.POSITIVE_INFINITY))
      .filter((v) => Number.isFinite(v))
    const floor: Metric<Money> = pricedCents.length
      ? ok({ cents: Math.min(...pricedCents), currency: 'USD' }, prov)
      : insufficient(prov)

    const volumeCents = detail.recentSales
      .filter((s) => s.kind === 'transaction')
      .reduce((a, s) => a + s.price.cents, 0)
    const volume: Money = { cents: volumeCents, currency: 'USD' }

    return {
      id: detail.id,
      game: detail.game,
      label: detail.label,
      index: detail.index,
      base: detail.base,
      deltas: detail.deltas,
      sparkline: detail.sparkline,
      updatedAt: detail.updatedAt,
      constituentCount: detail.constituentCount,
      risk,
      constituents: detail.constituents,
      recentSales: detail.recentSales,
      floor,
      volume,
      indexSeries,
    }
  })
}

export function buildCategoryCard(a: CategoryAnalytics): CategoryCard {
  const { id, game, label, index, base, deltas, sparkline, updatedAt, constituentCount, risk } = a
  return { id, game, label, index, base, deltas, sparkline, updatedAt, constituentCount, risk }
}

export async function buildOverview(source: DataSource, now: number): Promise<Overview> {
  return memo('overview', TTL, now, async () => {
    const cats = await source.getCategories()
    const analytics = await Promise.all(cats.map((c) => buildCategoryAnalytics(source, c.id, now)))
    const categories = analytics.map(buildCategoryCard)
    const totalListings = cats.reduce((a, c) => a + c.constituentCount, 0)
    const totalVolumeCents = analytics.reduce((a, x) => a + x.volume.cents, 0)
    const topMovers: Mover[] = await source.getFeaturedMovers(6)
    const asOf = cats.reduce<string>((latest, c) => (c.updatedAt > latest ? c.updatedAt : latest), cats[0]?.updatedAt ?? new Date(now).toISOString())
    const src: SourceId = cats[0]?.index.provenance.source ?? 'seed'
    return {
      totalListings,
      totalVolume: { cents: totalVolumeCents, currency: 'USD' },
      topMovers,
      categories,
      source: src,
      asOf,
    }
  })
}
