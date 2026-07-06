import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  ProvenanceSchema,
  metricSchema,
  CategorySchema,
  MoneySchema,
} from './schema'
import type { Provenance } from './metric'

const prov = {
  source: 'seed',
  asOf: '2026-06-01T00:00:00.000Z',
  confidence: 'high',
  sampleSize: 10,
} as const

describe('Provenance envelope schema (DATA-03)', () => {
  it('carries exactly the four descriptor fields {source, asOf, confidence, sampleSize}', () => {
    const parsed = ProvenanceSchema.parse(prov)
    expect(Object.keys(parsed).sort()).toEqual(['asOf', 'confidence', 'sampleSize', 'source'])
  })

  it('parse output is assignable to the Provenance interface', () => {
    const p: Provenance = ProvenanceSchema.parse(prov) // compile-time proof of equivalence
    expect(p.confidence).toBe('high')
    expect(p.sampleSize).toBe(10)
  })
})

describe('metricSchema envelope', () => {
  const M = metricSchema(z.number())

  it('rejects a value WITHOUT provenance (the core "no bare number" guarantee)', () => {
    expect(() => M.parse({ ok: true, value: 100 })).toThrow()
  })

  it('rejects a bare number (not the envelope shape)', () => {
    expect(M.safeParse(100).success).toBe(false)
  })

  it('accepts an ok metric with provenance', () => {
    const r = M.parse({ ok: true, value: 100, provenance: prov })
    expect(r.ok).toBe(true)
  })

  it('accepts a first-class insufficient metric', () => {
    const r = M.parse({ ok: false, insufficient: true, provenance: prov })
    expect(r.ok).toBe(false)
  })
})

describe('entity schemas', () => {
  it('a Category with an ok index parses and round-trips its id', () => {
    const cat = {
      id: 'pokemon',
      game: 'pokemon',
      label: 'Pokémon',
      index: { ok: true, value: 112.3, provenance: prov },
      base: 100,
      deltas: { d7: 1.2, d30: 3.4, d365: null },
      constituentCount: 20,
      sparkline: [],
      updatedAt: '2026-06-01T00:00:00.000Z',
    }
    expect(CategorySchema.parse(cat).id).toBe('pokemon')
  })

  it('Money defaults currency to USD', () => {
    expect(MoneySchema.parse({ cents: 500 }).currency).toBe('USD')
  })
})
