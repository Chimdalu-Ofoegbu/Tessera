import { describe, it, expect } from 'vitest'
import { MockSource } from './MockSource'
import { getDataSource } from '../getDataSource'
import { CategorySchema, CategoryDetailSchema } from '../schema'
import { SEED_IDS } from '../fixtures'

const src = new MockSource()

describe('MockSource — seed data behind the port', () => {
  it('returns all four seeded categories, each provenance-wrapped (source seed)', async () => {
    const cats = await src.getCategories()
    expect(cats.length).toBe(4)
    for (const c of cats) {
      expect(() => CategorySchema.parse(c)).not.toThrow()
      expect(c.index.provenance.source).toBe('seed')
    }
  })

  it('every fixture detail conforms to CategoryDetailSchema', async () => {
    for (const id of SEED_IDS) {
      const d = await src.getCategory(id)
      expect(() => CategoryDetailSchema.parse(d)).not.toThrow()
    }
  })

  it('the deliberately-thin category (lorcana) is INSUFFICIENT at tile + series level', async () => {
    const cats = await src.getCategories()
    const lorcana = cats.find((c) => c.id === 'lorcana')!
    expect(lorcana.index.ok).toBe(false)
    const series = await src.getIndexSeries('lorcana', 30)
    expect(series.ok).toBe(false)
  })

  it('a liquid category (pokemon) has an ok index and a sufficient 30d series', async () => {
    const cats = await src.getCategories()
    const pokemon = cats.find((c) => c.id === 'pokemon')!
    expect(pokemon.index.ok).toBe(true)
    const series = await src.getIndexSeries('pokemon', 30)
    expect(series.ok).toBe(true)
    if (series.ok) expect(series.value.length).toBeGreaterThanOrEqual(5)
  })

  it('getCategory throws for an unknown id', async () => {
    await expect(src.getCategory('does-not-exist')).rejects.toThrow()
  })

  it('movers exclude the insufficient category and are sorted by |d7|', async () => {
    const movers = await src.getFeaturedMovers()
    expect(movers.find((m) => m.id === 'lorcana')).toBeUndefined()
    expect(movers[0].id).toBe('one-piece') // largest |d7| (12.4)
  })

  it('getDataSource() returns a working source whose health is seed', async () => {
    const ds = getDataSource()
    const h = await ds.health()
    expect(h).toEqual({ ok: true, source: 'seed' })
  })
})
