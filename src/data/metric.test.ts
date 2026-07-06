import { describe, it, expect } from 'vitest'
import { ok, insufficient, isOk, type Provenance } from './metric'

const prov: Provenance = {
  source: 'seed',
  asOf: '2026-06-01T00:00:00.000Z',
  confidence: 'high',
  sampleSize: 12,
}

describe('Metric envelope', () => {
  it('ok() carries value + provenance', () => {
    const m = ok(100, prov)
    expect(m.ok).toBe(true)
    if (m.ok) expect(m.value).toBe(100)
    expect(m.provenance.source).toBe('seed')
  })

  it('insufficient() is first-class and still carries provenance', () => {
    const m = insufficient<number>(prov)
    expect(m.ok).toBe(false)
    if (!m.ok) expect(m.insufficient).toBe(true)
    expect(m.provenance.sampleSize).toBe(12)
  })

  it('isOk narrows to the present branch', () => {
    const m = ok('x', prov)
    expect(isOk(m)).toBe(true)
    const empty = insufficient<string>(prov)
    expect(isOk(empty)).toBe(false)
  })

  it('a value cannot be constructed without provenance (compile-time)', () => {
    // @ts-expect-error provenance is a required argument on every metric
    const bad = ok(1)
    void bad
  })
})
