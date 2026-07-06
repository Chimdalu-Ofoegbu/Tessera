/**
 * Seed fixtures — the demo-safe default data. Four deliberately distinct market
 * shapes so every engine branch (Phase 2) and the safety state have real data:
 *   pokemon    → LIQUID / healthy (smooth uptrend, deep sample)
 *   one-piece  → MOMENTUM SPIKE (sharp recent jump)
 *   sports     → CONCENTRATED (one constituent dominates value)
 *   lorcana    → DELIBERATELY THIN (below MIN_SAMPLE → index is INSUFFICIENT)
 *
 * All data is deterministic (no randomness, no render-time clock) so the index
 * "reproduces by hand" and `asOf` freshness is data-driven. This file is imported
 * ONLY from within `src/data/` (anti-corruption boundary).
 */
import { ok, insufficient, type Metric, type Provenance } from './metric'
import type { Category, CategoryDetail, Constituent, Money, PricePoint, Sale } from './schema'

const DAY = 86_400_000
/** Fixed freshness anchor — data `asOf`, never a live clock. */
export const AS_OF = '2026-07-01T00:00:00.000Z'
const ANCHOR = Date.parse(AS_OF)

const usd = (cents: number): Money => ({ cents, currency: 'USD' })
const prov = (confidence: Provenance['confidence'], sampleSize: number): Provenance => ({
  source: 'seed',
  asOf: AS_OF,
  confidence,
  sampleSize,
})

/** Deterministic price series (no Math.random): drift + a fixed sine wobble. */
function genSeries(startCents: number, days: number, stepDays: number, driftPct: number, amp: number): PricePoint[] {
  const pts: PricePoint[] = []
  const n = Math.floor(days / stepDays)
  for (let i = 0; i <= n; i++) {
    const frac = n === 0 ? 1 : i / n
    const drift = 1 + (driftPct / 100) * frac
    const wobble = 1 + amp * Math.sin(i * 1.3)
    const usdCents = Math.max(1, Math.round(startCents * drift * wobble))
    const t = new Date(ANCHOR - (days - i * stepDays) * DAY).toISOString()
    pts.push({ t, usdCents, n: 3, kind: 'transaction', source: 'seed', bucket: 'public' })
  }
  return pts
}

/** Add a momentum spike to the tail of a series. */
function withSpike(series: PricePoint[], mult: number): PricePoint[] {
  const cut = Math.max(0, series.length - 3)
  return series.map((p, i) => (i >= cut ? { ...p, usdCents: Math.round(p.usdCents * mult) } : p))
}

const constituent = (
  rank: number,
  name: string,
  setName: string,
  cardNumber: string,
  grade: string,
  cents: number,
  deltaPct: number | null,
  price: Metric<Money> = ok(usd(cents), prov('medium', 10)),
): Constituent => ({ rank, name, setName, cardNumber, grade, price, deltaPct, lastSaleAt: AS_OF })

const sale = (daysAgo: number, cents: number, kind: 'transaction' | 'listing', grade: string): Sale => ({
  observedAt: new Date(ANCHOR - daysAgo * DAY).toISOString(),
  kind,
  price: usd(cents),
  source: 'seed',
  company: 'PSA',
  grade,
  gradeLabel: `PSA ${grade}`,
})

export interface Seed {
  id: string
  game: string
  label: string
  base: number
  index: Metric<number>
  deltas: Category['deltas']
  updatedAt: string
  sparkline: PricePoint[]
  series: PricePoint[]
  constituents: Constituent[]
  sales: Sale[]
}

// pokemon — LIQUID / healthy: deep sample, high confidence, smooth uptrend.
const pokemonSeries = genSeries(200_000, 90, 3, 22, 0.04)
// one-piece — MOMENTUM SPIKE: medium sample, sharp recent jump.
const onePieceSeries = withSpike(genSeries(90_000, 90, 3, 8, 0.05), 1.28)
// sports — CONCENTRATED: rank-1 constituent dominates category value.
const sportsSeries = genSeries(140_000, 90, 3, 9, 0.06)
// lorcana — THIN: only 2 points (< MIN_SAMPLE) → index insufficient.
const lorcanaSeries = genSeries(30_000, 6, 6, 0, 0.02)

const SEEDS: Seed[] = [
  {
    id: 'pokemon',
    game: 'pokemon',
    label: 'Pokémon',
    base: 100,
    index: ok(122.4, prov('high', 42)),
    deltas: { d7: 1.8, d30: 5.2, d365: 22.4 },
    updatedAt: AS_OF,
    sparkline: pokemonSeries.slice(-14),
    series: pokemonSeries,
    constituents: [
      constituent(1, 'Charizard', 'Base Set', '4', '10', 250_000, 2.1, ok(usd(250_000), prov('high', 30))),
      constituent(2, 'Blastoise', 'Base Set', '2', '10', 180_000, 1.4, ok(usd(180_000), prov('high', 24))),
      constituent(3, 'Venusaur', 'Base Set', '15', '10', 120_000, 0.9, ok(usd(120_000), prov('high', 20))),
      constituent(4, 'Pikachu', 'Base Set', '58', '10', 60_000, 3.2, ok(usd(60_000), prov('medium', 12))),
    ],
    sales: [sale(1, 251_000, 'transaction', '10'), sale(2, 178_000, 'transaction', '10'), sale(3, 61_500, 'listing', '10'), sale(5, 119_000, 'transaction', '10')],
  },
  {
    id: 'one-piece',
    game: 'one-piece',
    label: 'One Piece',
    base: 100,
    index: ok(118.9, prov('medium', 18)),
    deltas: { d7: 12.4, d30: 18.0, d365: 41.2 },
    updatedAt: AS_OF,
    sparkline: onePieceSeries.slice(-14),
    series: onePieceSeries,
    constituents: [
      constituent(1, 'Monkey D. Luffy', 'Romance Dawn', 'OP01-001', '10', 140_000, 14.0, ok(usd(140_000), prov('medium', 12))),
      constituent(2, 'Roronoa Zoro', 'Romance Dawn', 'OP01-025', '10', 70_000, 9.5, ok(usd(70_000), prov('medium', 9))),
      constituent(3, 'Shanks', 'Romance Dawn', 'OP01-120', '10', 55_000, 11.2, ok(usd(55_000), prov('low', 5))),
    ],
    sales: [sale(1, 141_000, 'transaction', '10'), sale(1, 69_000, 'transaction', '10'), sale(4, 54_000, 'listing', '10')],
  },
  {
    id: 'sports',
    game: 'sports',
    label: 'Sports',
    base: 100,
    index: ok(108.5, prov('medium', 22)),
    deltas: { d7: -0.6, d30: 2.1, d365: 9.3 },
    updatedAt: AS_OF,
    sparkline: sportsSeries.slice(-14),
    series: sportsSeries,
    constituents: [
      // rank-1 dominates → concentrated market
      constituent(1, 'Michael Jordan RC', 'Fleer', '57', '10', 900_000, 0.4, ok(usd(900_000), prov('high', 26))),
      constituent(2, 'LeBron James RC', 'Topps Chrome', '111', '10', 60_000, -1.2, ok(usd(60_000), prov('medium', 10))),
      constituent(3, 'Kobe Bryant RC', 'Topps', '138', '10', 45_000, 0.8, ok(usd(45_000), prov('medium', 8))),
      constituent(4, 'Tom Brady RC', 'Bowman', '236', '10', 30_000, -0.3, ok(usd(30_000), prov('low', 5))),
    ],
    sales: [sale(2, 905_000, 'transaction', '10'), sale(3, 59_000, 'listing', '10'), sale(6, 44_000, 'transaction', '10')],
  },
  {
    id: 'lorcana',
    game: 'lorcana',
    label: 'Disney Lorcana (beta)',
    base: 100,
    // THIN: below MIN_SAMPLE → the index is INSUFFICIENT, not a fabricated number.
    index: insufficient(prov('low', 2)),
    deltas: { d7: null, d30: null, d365: null },
    updatedAt: AS_OF,
    sparkline: lorcanaSeries,
    series: lorcanaSeries,
    constituents: [
      constituent(1, 'Elsa — Snow Queen', 'The First Chapter', '42', '10', 25_000, null, insufficient(prov('low', 2))),
    ],
    sales: [sale(4, 24_000, 'listing', '10')],
  },
]

export const SEED_BY_ID: Record<string, Seed> = Object.fromEntries(SEEDS.map((s) => [s.id, s]))
export const SEED_IDS = SEEDS.map((s) => s.id)

/** Project a seed record to a Category tile. */
export function toTile(s: Seed): Category {
  return {
    id: s.id,
    game: s.game,
    label: s.label,
    index: s.index,
    base: s.base,
    deltas: s.deltas,
    constituentCount: s.constituents.length,
    sparkline: s.sparkline,
    updatedAt: s.updatedAt,
  }
}

/** Project a seed record to a full CategoryDetail. */
export function toDetail(s: Seed): CategoryDetail {
  return { ...toTile(s), constituents: s.constituents, recentSales: s.sales }
}
