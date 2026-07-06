/**
 * Pure mappers: raw Renaiss Index API shapes → Tessera's normalized entities +
 * provenance. No I/O. `now` is injected so the freshness/stale calculation is
 * deterministic and unit-testable. USD cents are normalized to `Money`; the
 * insufficient rule mirrors RENAISS-API.md: low confidence OR sampleSize below
 * MIN_SAMPLE OR data older than MAX_STALE_DAYS.
 */
import { ok, insufficient, type Confidence, type Metric, type Provenance } from '../metric'
import type { Category, Constituent, Money, PricePoint, Sale } from '../schema'
import { MIN_SAMPLE, MAX_STALE_DAYS } from '../../core/thresholds'

const DAY = 86_400_000
const usd = (cents: number): Money => ({ cents, currency: 'USD' })

// Raw shapes we consume (a subset of the documented schema).
export interface RawSeriesPoint {
  t: string
  usdCents: number
  n?: number
  kind?: string | null
  source?: string | null
  bucket?: string | null
}
export interface RawIndexTile {
  game: string
  label: string
  value: number
  base?: number
  deltas?: { d7: number | null; d30: number | null; d365: number | null }
  constituentCount?: number
  sparkline?: RawSeriesPoint[]
  updatedAt?: string | null
}
export interface RawIndexDetail extends RawIndexTile {
  constituents?: RawConstituent[]
  recentTrades?: RawTrade[]
  trades?: RawTrade[]
}
export interface RawConstituent {
  rank: number
  name: string
  setName?: string | null
  cardNumber?: string | null
  grade?: string | null
  priceUsdCents: number | null
  deltaPct?: number | null
  lastSaleAt?: string | null
}
export interface RawTrade {
  source?: string
  observedAt: string
  kind: string
  priceUsdCents: number | null
  currency?: string
  company?: string | null
  grade?: string | null
  gradeLabel?: string | null
}

const ageDays = (iso: string | null | undefined, now: number): number =>
  iso ? Math.max(0, (now - Date.parse(iso)) / DAY) : Number.POSITIVE_INFINITY

function confidenceFor(sampleSize: number, staleDays: number): Confidence {
  if (sampleSize >= 20 && staleDays <= MAX_STALE_DAYS) return 'high'
  if (sampleSize >= MIN_SAMPLE && staleDays <= MAX_STALE_DAYS * 2) return 'medium'
  return 'low'
}

export function mapProvenance(sampleSize: number, asOf: string | null | undefined, now: number): Provenance {
  return {
    source: 'renaiss',
    asOf: asOf ?? new Date(now).toISOString(),
    confidence: confidenceFor(sampleSize, ageDays(asOf, now)),
    sampleSize,
  }
}

export function mapSeriesPoint(p: RawSeriesPoint): PricePoint {
  const kind = p.kind === 'transaction' || p.kind === 'listing' ? p.kind : null
  return {
    t: p.t,
    usdCents: Math.max(0, Math.round(p.usdCents)),
    n: p.n ?? 0,
    kind,
    source: 'renaiss',
    bucket: p.bucket ?? null,
  }
}

export function mapIndexTileToCategory(tile: RawIndexTile, now: number): Category {
  const sampleSize = tile.constituentCount ?? 0
  const staleDays = ageDays(tile.updatedAt, now)
  const prov = mapProvenance(sampleSize, tile.updatedAt, now)
  const sparkline = (tile.sparkline ?? []).map(mapSeriesPoint)
  const thin = sampleSize < MIN_SAMPLE || staleDays > MAX_STALE_DAYS || sparkline.length < MIN_SAMPLE
  const index: Metric<number> = thin ? insufficient(prov) : ok(tile.value, prov)
  return {
    id: tile.game,
    game: tile.game,
    label: tile.label,
    index,
    base: tile.base ?? 100,
    deltas: { d7: tile.deltas?.d7 ?? null, d30: tile.deltas?.d30 ?? null, d365: tile.deltas?.d365 ?? null },
    constituentCount: sampleSize,
    sparkline,
    updatedAt: tile.updatedAt ?? new Date(now).toISOString(),
  }
}

export function mapConstituent(c: RawConstituent, now: number): Constituent {
  const price: Metric<Money> =
    c.priceUsdCents == null
      ? insufficient(mapProvenance(0, c.lastSaleAt, now))
      : ok(usd(c.priceUsdCents), mapProvenance(1, c.lastSaleAt, now))
  return {
    rank: c.rank,
    name: c.name,
    setName: c.setName ?? null,
    cardNumber: c.cardNumber ?? null,
    grade: c.grade ?? null,
    price,
    deltaPct: c.deltaPct ?? null,
    lastSaleAt: c.lastSaleAt ?? null,
  }
}

export function mapTradeToSale(t: RawTrade): Sale {
  return {
    observedAt: t.observedAt,
    kind: t.kind === 'listing' ? 'listing' : 'transaction',
    price: usd(Math.max(0, Math.round(t.priceUsdCents ?? 0))),
    source: t.source ?? 'renaiss',
    company: t.company ?? null,
    grade: t.grade ?? null,
    gradeLabel: t.gradeLabel ?? null,
  }
}
