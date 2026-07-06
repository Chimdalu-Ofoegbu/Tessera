import { describe, it, expect } from 'vitest'
import {
  computeRisk,
  liquidityRisk,
  volatilityRisk,
  concentrationRisk,
  dataConfidenceRisk,
  type RiskInput,
} from './risk'
import type { PricePoint } from '../data/schema'

const NOW = Date.parse('2026-07-02T00:00:00.000Z')
const pt = (t: string, usdCents: number, n = 4): PricePoint => ({
  t,
  usdCents,
  n,
  kind: 'transaction',
  source: 'seed',
  bucket: 'public',
})
const series = (prices: number[], n = 4): PricePoint[] =>
  prices.map((p, i) => pt(new Date(NOW - (prices.length - i) * 86_400_000).toISOString(), p, n))

const baseInput = (over: Partial<RiskInput> = {}): RiskInput => ({
  series: series([200000, 205000, 210000, 215000, 240000]),
  constituentValuesCents: [250000, 180000, 120000, 60000],
  sampleSize: 40,
  confidence: 'high',
  asOf: '2026-07-01T00:00:00.000Z',
  source: 'seed',
  now: NOW,
  ...over,
})

describe('risk engine', () => {
  it('is deterministic (same input → deep-equal result)', () => {
    expect(computeRisk(baseInput())).toEqual(computeRisk(baseInput()))
  })

  it('factor contributions reconcile to the headline score', () => {
    const r = computeRisk(baseInput())
    expect(r.ok).toBe(true)
    if (r.ok) {
      const f = r.value.factors
      const sum =
        f.liquidity.contribution +
        f.volatility.contribution +
        f.concentration.contribution +
        f.dataConfidence.contribution
      expect(Math.round(sum)).toBe(r.value.score)
    }
  })

  it('a concentrated market scores higher concentration than a diffuse one', () => {
    expect(concentrationRisk([900000, 30000, 20000, 10000])).toBeGreaterThan(
      concentrationRisk([100000, 100000, 100000, 100000]),
    )
  })

  it('a volatile series scores higher volatility than a flat one', () => {
    expect(volatilityRisk([100000, 300000, 50000, 250000])).toBeGreaterThan(
      volatilityRisk([100000, 101000, 99000, 100500]),
    )
  })

  it('a thin series (< MIN_SAMPLE points) → insufficient (RISK-05)', () => {
    const r = computeRisk(baseInput({ series: series([100000, 110000]) }))
    expect(r.ok).toBe(false)
  })

  it('low confidence + tiny sample → insufficient', () => {
    const r = computeRisk(baseInput({ confidence: 'low', sampleSize: 2 }))
    expect(r.ok).toBe(false)
  })

  it('carries the engine version and finite factors in [0,100]', () => {
    const r = computeRisk(baseInput())
    if (r.ok) {
      expect(r.value.version).toBe('risk@1.0.0')
      for (const f of Object.values(r.value.factors)) {
        expect(Number.isFinite(f.raw)).toBe(true)
        expect(f.raw).toBeGreaterThanOrEqual(0)
        expect(f.raw).toBeLessThanOrEqual(100)
      }
    }
  })

  it('factor monotonicity: fewer trades and worse data → higher risk', () => {
    expect(liquidityRisk(4)).toBeGreaterThan(liquidityRisk(40))
    expect(dataConfidenceRisk('low', 2, 60)).toBeGreaterThan(dataConfidenceRisk('high', 40, 1))
  })
})
