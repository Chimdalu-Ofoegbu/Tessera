import { describe, it, expect } from 'vitest'
import sample from './fixtures/indices.sample.json'
import {
  mapConstituent,
  mapIndexTileToCategory,
  mapTradeToSale,
  type RawConstituent,
  type RawIndexDetail,
  type RawIndexTile,
  type RawTrade,
} from './map'
import { CategoryDetailSchema, CategorySchema, SaleSchema } from '../schema'
import { buildIndex } from '../../core/indexEngine'
import { computeRisk } from '../../core/risk'
import { getDataSource } from '../getDataSource'
import { MockSource } from '../mock/MockSource'
import { RenaissSource } from './RenaissSource'

// Fixed clock → deterministic freshness (no live network call anywhere here).
const NOW = Date.parse('2026-07-02T00:00:00.000Z')
const indices = sample.indices as unknown as RawIndexTile[]

describe('Renaiss mappers (captured JSON, no live call)', () => {
  it('maps a healthy index tile to an ok Category with renaiss provenance', () => {
    const cat = mapIndexTileToCategory(indices[0], NOW)
    expect(() => CategorySchema.parse(cat)).not.toThrow()
    expect(cat.index.ok).toBe(true)
    expect(cat.index.provenance.source).toBe('renaiss')
    expect(cat.index.provenance.confidence).toBe('high')
  })

  it('maps a thin tile to an INSUFFICIENT index (safety preserved on real data)', () => {
    const cat = mapIndexTileToCategory(indices[1], NOW)
    expect(cat.index.ok).toBe(false)
  })

  it('live-shaped sparkline (no per-point n) inherits the tile constituent backing and still publishes', () => {
    // The real /v1/indices payload (observed 2026-07-08) omits `n` on sparkline points —
    // an already-aggregated daily index series. Absent disclosure must not read as "0 observations".
    const live: RawIndexTile = {
      game: 'pokemon',
      label: 'Pokémon · Index',
      value: 11255.7,
      constituentCount: 50,
      updatedAt: '2026-07-01T00:00:00.000Z',
      sparkline: Array.from({ length: 30 }, (_, i) => ({
        t: new Date(Date.parse('2026-06-01T00:00:00.000Z') + i * 86_400_000).toISOString(),
        usdCents: 1_100_000 + i * 5_000,
      })),
    }
    const cat = mapIndexTileToCategory(live, NOW)
    expect(cat.index.ok).toBe(true)
    expect(cat.sparkline.every((p) => p.n === 50)).toBe(true)
    // The exact regression: both engines must publish over this series, not render insufficient.
    const prov = cat.index.provenance
    const idx = buildIndex({ series: cat.sparkline, source: prov.source, asOf: prov.asOf, confidence: prov.confidence, sampleSize: prov.sampleSize })
    expect(idx.ok).toBe(true)
    const risk = computeRisk({ series: cat.sparkline, constituentValuesCents: [500_000, 400_000, 300_000], sampleSize: prov.sampleSize, confidence: prov.confidence, asOf: prov.asOf, source: prov.source, now: NOW })
    expect(risk.ok).toBe(true)
    // An explicitly disclosed n is preserved, not overwritten.
    const disclosed = mapIndexTileToCategory({ ...live, sparkline: [{ t: '2026-06-01T00:00:00.000Z', usdCents: 1_000_000, n: 7 }, ...live.sparkline!.slice(1)] }, NOW)
    expect(disclosed.sparkline[0].n).toBe(7)
  })

  it('builds a schema-valid CategoryDetail; a null-price card maps to insufficient (no fabricated 0)', () => {
    const d = sample.detail as unknown as RawIndexDetail
    const tile = mapIndexTileToCategory(d, NOW)
    const detail = {
      ...tile,
      constituents: (d.constituents ?? []).map((c) => mapConstituent(c as RawConstituent, NOW)),
      recentSales: (d.recentTrades ?? []).map((t) => mapTradeToSale(t as RawTrade)),
    }
    expect(() => CategoryDetailSchema.parse(detail)).not.toThrow()
    const venusaur = detail.constituents.find((c) => c.name === 'Venusaur')!
    expect(venusaur.price.ok).toBe(false)
  })

  it('maps trades to schema-valid Sales', () => {
    const sales = (sample.recentTrades as unknown as RawTrade[]).map(mapTradeToSale)
    expect(sales.length).toBeGreaterThan(0)
    for (const s of sales) expect(() => SaleSchema.parse(s)).not.toThrow()
  })
})

describe('getDataSource() wiring — the single mock→real swap (DATA-02)', () => {
  it('returns MockSource by default (demo-safe)', () => {
    delete process.env.USE_RENAISS
    delete process.env.RENAISS_API_KEY
    delete process.env.RENAISS_API_SECRET
    expect(getDataSource()).toBeInstanceOf(MockSource)
  })

  it('returns RenaissSource when USE_RENAISS=1', () => {
    process.env.USE_RENAISS = '1'
    try {
      expect(getDataSource()).toBeInstanceOf(RenaissSource)
    } finally {
      delete process.env.USE_RENAISS
    }
  })
})
