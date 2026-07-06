import { describe, it, expect, beforeEach } from 'vitest'
import overview from '../../api/overview'
import categoryDetail from '../../api/categories/[id]'
import health from '../../api/health'
import { clearComputeCache } from './cache'

// Minimal VercelResponse stand-in that captures what a handler writes.
function mockRes() {
  const res = {
    statusCode: 0,
    body: null as unknown,
    headers: {} as Record<string, string>,
    setHeader(k: string, v: string) {
      this.headers[k] = v
      return this
    },
    status(c: number) {
      this.statusCode = c
      return this
    },
    json(b: unknown) {
      this.body = b
      return this
    },
  }
  return res
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (query: Record<string, unknown> = {}) => ({ query }) as any

beforeEach(() => clearComputeCache())

describe('API handlers (runtime, MockSource)', () => {
  it('GET /api/overview → 200 with category cards + cache header', async () => {
    const res = mockRes()
    await overview(req(), res as never)
    expect(res.statusCode).toBe(200)
    expect(res.headers['Cache-Control']).toContain('s-maxage')
    const body = res.body as { categories: unknown[] }
    expect(Array.isArray(body.categories)).toBe(true)
    expect(body.categories.length).toBe(4)
  })

  it('GET /api/categories/:id → 200 for a known id', async () => {
    const res = mockRes()
    await categoryDetail(req({ id: 'pokemon' }), res as never)
    expect(res.statusCode).toBe(200)
    const body = res.body as { id: string; risk: { ok: boolean } }
    expect(body.id).toBe('pokemon')
    expect(body.risk.ok).toBe(true)
  })

  it('GET /api/categories/:id → 404 JSON for an unknown id (no crash)', async () => {
    const res = mockRes()
    await categoryDetail(req({ id: 'does-not-exist' }), res as never)
    expect(res.statusCode).toBe(404)
    expect((res.body as { error: string }).error).toBe('unknown category')
  })

  it('GET /api/health → 200 { ok, source: seed }', async () => {
    const res = mockRes()
    await health(req(), res as never)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true, source: 'seed' })
  })
})
