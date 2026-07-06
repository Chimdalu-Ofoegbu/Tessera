import { describe, it, expect } from 'vitest'
import { buildIndex, vwap, type IndexInput } from './indexEngine'
import type { PricePoint } from '../data/schema'

const pt = (t: string, usdCents: number, n = 4): PricePoint => ({
  t,
  usdCents,
  n,
  kind: 'transaction',
  source: 'seed',
  bucket: 'public',
})

const input = (s: PricePoint[]): IndexInput => ({
  series: s,
  source: 'seed',
  asOf: '2026-07-01T00:00:00.000Z',
  confidence: 'high',
  sampleSize: 40,
})

const fiveGood = [
  pt('2026-06-01T00:00:00.000Z', 200000),
  pt('2026-06-08T00:00:00.000Z', 210000),
  pt('2026-06-15T00:00:00.000Z', 240000),
  pt('2026-06-22T00:00:00.000Z', 220000),
  pt('2026-06-29T00:00:00.000Z', 260000),
]

describe('index engine', () => {
  it('base period reads exactly 100 and reproduces by hand', () => {
    const r = buildIndex(input(fiveGood))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.points[0].value).toBe(100)
      expect(r.value.points[1].value).toBe(105) // 100·210000/200000
      expect(r.value.points[2].value).toBe(120) // 100·240000/200000
      expect(r.value.base).toBe(100)
      expect(r.value.current).toBe(130) // 100·260000/200000
      expect(r.value.version).toBe('index@1.0.0')
    }
  })

  it('renders an explicit gap (null) for a thin point, never interpolated', () => {
    const r = buildIndex(
      input([
        pt('2026-06-01T00:00:00.000Z', 200000, 4),
        pt('2026-06-08T00:00:00.000Z', 210000, 1), // n=1 < MIN_POINT_SAMPLE → gap
        pt('2026-06-15T00:00:00.000Z', 240000, 4),
        pt('2026-06-22T00:00:00.000Z', 220000, 4),
        pt('2026-06-29T00:00:00.000Z', 260000, 4),
      ]),
    )
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.points[1].value).toBeNull()
  })

  it('a thin series (< MIN_SAMPLE points) → insufficient (IDX-03)', () => {
    const r = buildIndex(input([pt('2026-06-01T00:00:00.000Z', 200000), pt('2026-06-08T00:00:00.000Z', 210000)]))
    expect(r.ok).toBe(false)
  })

  it('is deterministic', () => {
    expect(buildIndex(input(fiveGood))).toEqual(buildIndex(input(fiveGood)))
  })

  it('vwap weights by n', () => {
    // (100·1 + 200·3) / (1+3) = 700/4 = 175
    expect(vwap([pt('t', 100, 1), pt('t', 200, 3)])).toBe(175)
  })
})
