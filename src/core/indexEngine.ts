/**
 * Index engine — a volume-weighted price index rebased to 100 at the base period,
 * reproducible by hand (`value_t = 100 · price_t / price_base`). Pure, deterministic,
 * versioned. Thin periods render an explicit gap (null) — never interpolated; a thin
 * series returns first-class insufficiency. Implements 02-METHODOLOGY.md exactly.
 */
import { insufficient, ok, type Confidence, type Metric, type Provenance, type SourceId } from '../data/metric'
import type { PricePoint } from '../data/schema'
import { INDEX_ENGINE_VERSION, MIN_POINT_SAMPLE, MIN_SAMPLE } from './thresholds'

const round2 = (x: number): number => Math.round(x * 100) / 100

export interface IndexPoint {
  t: string
  value: number | null
  n: number
}
export interface IndexResult {
  base: number
  basePrice: number
  points: IndexPoint[]
  current: number
  version: string
}
export interface IndexInput {
  series: PricePoint[]
  source: SourceId
  asOf: string
  confidence: Confidence
  sampleSize: number
}

/** Volume-weighted average price: Σ(usdCents·n) / Σ n. */
export function vwap(points: PricePoint[]): number {
  const totalN = points.reduce((a, p) => a + (p.n ?? 0), 0)
  if (totalN <= 0) return 0
  const weighted = points.reduce((a, p) => a + p.usdCents * (p.n ?? 0), 0)
  return weighted / totalN
}

export function buildIndex(input: IndexInput): Metric<IndexResult> {
  const { series, source, asOf, confidence, sampleSize } = input
  const prov: Provenance = { source, asOf, confidence, sampleSize }

  const sorted = [...series].sort((a, b) => Date.parse(a.t) - Date.parse(b.t))
  const baseP = sorted.find((p) => (p.n ?? 0) >= MIN_POINT_SAMPLE)

  // Insufficient guard (IDX-03) — no valid base period or too few points.
  if (sorted.length < MIN_SAMPLE || !baseP || baseP.usdCents <= 0) {
    return insufficient(prov)
  }

  const basePrice = baseP.usdCents
  const points: IndexPoint[] = sorted.map((p) => ({
    t: p.t,
    // Thin period → explicit gap (null), never interpolated.
    value: (p.n ?? 0) >= MIN_POINT_SAMPLE ? round2((100 * p.usdCents) / basePrice) : null,
    n: p.n ?? 0,
  }))
  const nonNull = points.filter((p) => p.value !== null)
  const current = nonNull.length ? (nonNull[nonNull.length - 1].value as number) : 100

  return ok({ base: 100, basePrice, points, current, version: INDEX_ENGINE_VERSION }, prov)
}
