import { describe, it, expect, beforeEach } from 'vitest'
import { buildOverview, buildCategoryAnalytics } from './compute'
import { clearComputeCache } from './cache'
import { MockSource } from '../data/mock/MockSource'

const NOW = Date.parse('2026-07-02T00:00:00.000Z')
const src = new MockSource()

beforeEach(() => clearComputeCache())

describe('compute layer (source → engines → payloads)', () => {
  it('overview returns 4 cards, each with provenance on index AND risk', async () => {
    const o = await buildOverview(src, NOW)
    expect(o.categories.length).toBe(4)
    for (const c of o.categories) {
      expect(c.index.provenance.source).toBe('seed')
      expect(c.risk.provenance.source).toBe('seed')
    }
  })

  it('thin category (lorcana) is insufficient for risk AND index end-to-end', async () => {
    const a = await buildCategoryAnalytics(src, 'lorcana', NOW)
    expect(a.risk.ok).toBe(false)
    expect(a.indexSeries.ok).toBe(false)
    expect(a.floor.ok).toBe(false)
  })

  it('liquid category (pokemon) has ok, reconciling risk and an ok index', async () => {
    const a = await buildCategoryAnalytics(src, 'pokemon', NOW)
    expect(a.risk.ok).toBe(true)
    expect(a.indexSeries.ok).toBe(true)
    if (a.risk.ok) {
      const f = a.risk.value.factors
      const sum =
        f.liquidity.contribution + f.volatility.contribution + f.concentration.contribution + f.dataConfidence.contribution
      expect(Math.round(sum)).toBe(a.risk.value.score)
    }
  })

  it('sports floor is the min priced constituent', async () => {
    const a = await buildCategoryAnalytics(src, 'sports', NOW)
    expect(a.floor.ok).toBe(true)
    if (a.floor.ok) expect(a.floor.value.cents).toBe(30000) // Tom Brady RC is the cheapest
  })

  it('overview totals are positive (volume + listings)', async () => {
    const o = await buildOverview(src, NOW)
    expect(o.totalVolume.cents).toBeGreaterThan(0)
    expect(o.totalListings).toBeGreaterThan(0)
  })

  it('memoizes: identical calls within TTL return the same reference', async () => {
    const a1 = await buildCategoryAnalytics(src, 'pokemon', NOW)
    const a2 = await buildCategoryAnalytics(src, 'pokemon', NOW)
    expect(a1).toBe(a2)
  })
})
