/**
 * Seed fixtures — the demo-safe default data, shaped like the real Renaiss Index
 * (graded trading cards) across 8 categories with deliberately distinct market
 * shapes so every engine branch (Phase 2) and the safety state have real data:
 *   pokemon (PKB)        → LIQUID / healthy (smooth uptrend, deep sample)
 *   pokemon-jpn (PKJ)    → premium vintage
 *   pokemon-modern (PKM) → high-liquidity / low-value / cooling
 *   one-piece (OPR)      → MOMENTUM SPIKE (sharp recent jump)
 *   one-piece-emp (OPE)  → chase set, high value
 *   sports (NBA)         → CONCENTRATED (one constituent dominates value)
 *   sports-vintage (MLB) → vintage, cooling
 *   lorcana (LOR)        → DELIBERATELY THIN (below MIN_SAMPLE → INSUFFICIENT)
 *
 * All data is deterministic (no randomness, no render-time clock) so the index
 * "reproduces by hand" and `asOf` freshness is data-driven. Imported ONLY from
 * within `src/data/` (anti-corruption boundary).
 */
import { ok, insufficient, type Metric, type Provenance } from './metric'
import type { Category, Constituent, Money, PricePoint, Sale } from './schema'

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

const sale = (daysAgo: number, cents: number, kind: 'transaction' | 'listing', grade: string, venue: string): Sale => ({
  observedAt: new Date(ANCHOR - daysAgo * DAY).toISOString(),
  kind,
  price: usd(cents),
  source: venue,
  company: 'PSA',
  grade,
  gradeLabel: `PSA ${grade}`,
})

export interface Seed {
  id: string
  code: string
  game: string
  label: string
  base: number
  index: Metric<number>
  change24h: number | null
  deltas: Category['deltas']
  listings: number
  sourceLabel: string
  verifiedSales90d: number
  salesThreshold: number
  updatedAt: string
  sparkline: PricePoint[]
  series: PricePoint[]
  constituents: Constituent[]
  sales: Sale[]
}

const V = { pwcc: 'PWCC', goldin: 'Goldin', heritage: 'Heritage', ebay: 'eBay (verified)', fanatics: 'Fanatics', psa: 'PSA/DNA' }

// Market-shape series
const pokemonSeries = genSeries(200_000, 90, 3, 22, 0.04) // LIQUID uptrend
const pokemonJpnSeries = genSeries(240_000, 90, 3, 12, 0.045)
const pokemonModernSeries = genSeries(9_000, 90, 3, -9, 0.06) // cooling
const onePieceSeries = withSpike(genSeries(90_000, 90, 3, 8, 0.05), 1.28) // SPIKE
const onePieceEmpSeries = genSeries(180_000, 90, 3, 14, 0.055)
const sportsSeries = genSeries(140_000, 90, 3, 9, 0.06) // CONCENTRATED
const sportsVintageSeries = genSeries(120_000, 90, 3, -4, 0.05)
const lorcanaSeries = genSeries(30_000, 6, 6, 0, 0.02) // THIN: 2 points < MIN_SAMPLE

const SEEDS: Seed[] = [
  {
    id: 'pokemon', code: 'PKB', game: 'pokemon', label: 'Pokémon · Base Set', base: 100,
    index: ok(128.4, prov('high', 42)), change24h: 3.42, deltas: { d7: 3.4, d30: 8.2, d365: 24.1 },
    listings: 1642, sourceLabel: 'RENAISS INDEX', verifiedSales90d: 480, salesThreshold: 25, updatedAt: AS_OF,
    sparkline: pokemonSeries.slice(-14), series: pokemonSeries,
    constituents: [
      constituent(1, 'Charizard', 'Base Set', '4/102', '10', 250_000, 2.1, ok(usd(250_000), prov('high', 30))),
      constituent(2, 'Blastoise', 'Base Set', '2/102', '10', 180_000, 1.4, ok(usd(180_000), prov('high', 24))),
      constituent(3, 'Venusaur', 'Base Set', '15/102', '10', 120_000, 0.9, ok(usd(120_000), prov('high', 20))),
      constituent(4, 'Pikachu (Red Cheeks)', 'Base Set', '58/102', '9', 60_000, 3.2, ok(usd(60_000), prov('medium', 12))),
    ],
    sales: [sale(1, 251_000, 'transaction', '10', V.pwcc), sale(2, 178_000, 'transaction', '10', V.goldin), sale(3, 61_500, 'listing', '9', V.ebay), sale(5, 119_000, 'transaction', '10', V.heritage), sale(8, 244_000, 'transaction', '10', V.pwcc), sale(11, 58_500, 'transaction', '9', V.fanatics)],
  },
  {
    id: 'pokemon-jpn', code: 'PKJ', game: 'pokemon', label: 'Pokémon · Japanese Vintage', base: 100,
    index: ok(141.7, prov('high', 30)), change24h: 1.18, deltas: { d7: 1.2, d30: 4.6, d365: 19.0 },
    listings: 486, sourceLabel: 'AUCTION FEED', verifiedSales90d: 210, salesThreshold: 25, updatedAt: AS_OF,
    sparkline: pokemonJpnSeries.slice(-14), series: pokemonJpnSeries,
    constituents: [
      constituent(1, 'No Rarity Charizard', 'Base (JP)', '', '9', 540_000, 1.6, ok(usd(540_000), prov('high', 18))),
      constituent(2, 'Trophy Pikachu (Bronze)', 'Promo', '', '9', 300_000, 0.7, ok(usd(300_000), prov('medium', 9))),
      constituent(3, 'Blastoise', 'Base (JP)', '', '10', 220_000, 1.1, ok(usd(220_000), prov('high', 14))),
      constituent(4, 'CoroCoro Mew Promo', 'Promo', '', '10', 130_000, 2.4, ok(usd(130_000), prov('medium', 11))),
    ],
    sales: [sale(2, 545_000, 'transaction', '9', V.heritage), sale(4, 128_000, 'transaction', '10', V.goldin), sale(6, 221_000, 'listing', '10', V.pwcc), sale(9, 298_000, 'transaction', '9', V.heritage)],
  },
  {
    id: 'pokemon-modern', code: 'PKM', game: 'pokemon', label: 'Pokémon · Scarlet & Violet', base: 100,
    index: ok(89.2, prov('high', 38)), change24h: -2.14, deltas: { d7: -2.1, d30: -5.8, d365: -9.4 },
    listings: 2874, sourceLabel: 'RENAISS INDEX', verifiedSales90d: 690, salesThreshold: 25, updatedAt: AS_OF,
    sparkline: pokemonModernSeries.slice(-14), series: pokemonModernSeries,
    constituents: [
      constituent(1, 'Charizard ex (SIR)', '151', '199', '10', 32_000, -1.8, ok(usd(32_000), prov('high', 22))),
      constituent(2, 'Mew ex (SAR)', '151', '205', '10', 18_000, -2.6, ok(usd(18_000), prov('high', 18))),
      constituent(3, 'Miraidon ex (SAR)', 'Obsidian Flames', '244', '10', 12_000, -1.1, ok(usd(12_000), prov('medium', 12))),
      constituent(4, 'Iono (SAR)', 'Paldea Evolved', '269', '10', 9_000, -3.0, ok(usd(9_000), prov('medium', 10))),
    ],
    sales: [sale(1, 31_500, 'transaction', '10', V.ebay), sale(1, 17_800, 'transaction', '10', V.fanatics), sale(3, 11_900, 'listing', '10', V.ebay), sale(4, 8_900, 'transaction', '10', V.fanatics), sale(7, 32_400, 'transaction', '10', V.pwcc)],
  },
  {
    id: 'one-piece', code: 'OPR', game: 'one-piece', label: 'One Piece · Romance Dawn', base: 100,
    index: ok(118.9, prov('medium', 18)), change24h: 5.71, deltas: { d7: 12.4, d30: 18.0, d365: 41.2 },
    listings: 1240, sourceLabel: 'HOUSE REPORTS', verifiedSales90d: 190, salesThreshold: 25, updatedAt: AS_OF,
    sparkline: onePieceSeries.slice(-14), series: onePieceSeries,
    constituents: [
      constituent(1, 'Monkey D. Luffy (Manga)', 'Romance Dawn', 'OP01-001', '10', 140_000, 14.0, ok(usd(140_000), prov('medium', 12))),
      constituent(2, 'Roronoa Zoro (Alt-Art)', 'Romance Dawn', 'OP01-025', '10', 70_000, 9.5, ok(usd(70_000), prov('medium', 9))),
      constituent(3, 'Shanks (Leader)', 'Romance Dawn', 'OP01-120', '10', 55_000, 11.2, ok(usd(55_000), prov('low', 5))),
    ],
    sales: [sale(1, 141_000, 'transaction', '10', V.ebay), sale(1, 69_000, 'transaction', '10', V.pwcc), sale(4, 54_000, 'listing', '10', V.ebay), sale(6, 138_000, 'transaction', '10', V.goldin)],
  },
  {
    id: 'one-piece-emp', code: 'OPE', game: 'one-piece', label: 'One Piece · Emperors', base: 100,
    index: ok(163.2, prov('medium', 15)), change24h: 2.9, deltas: { d7: 3.1, d30: 9.4, d365: null },
    listings: 214, sourceLabel: 'HOUSE REPORTS', verifiedSales90d: 96, salesThreshold: 25, updatedAt: AS_OF,
    sparkline: onePieceEmpSeries.slice(-14), series: onePieceEmpSeries,
    constituents: [
      constituent(1, 'Luffy Gear 5 (SEC)', 'Emperors', 'OP09-119', '10', 260_000, 3.4, ok(usd(260_000), prov('medium', 10))),
      constituent(2, 'Shanks (Alt-Art)', 'Emperors', 'OP09-093', '10', 210_000, 2.2, ok(usd(210_000), prov('medium', 8))),
      constituent(3, 'Kaido (Manga Rare)', 'Emperors', 'OP09-101', '10', 380_000, 4.1, ok(usd(380_000), prov('low', 6))),
      constituent(4, 'Big Mom (SP)', 'Emperors', 'OP09-072', '10', 140_000, 1.5, ok(usd(140_000), prov('medium', 7))),
    ],
    sales: [sale(2, 258_000, 'transaction', '10', V.goldin), sale(3, 375_000, 'transaction', '10', V.heritage), sale(5, 208_000, 'listing', '10', V.pwcc), sale(8, 139_000, 'transaction', '10', V.ebay)],
  },
  {
    id: 'sports', code: 'NBA', game: 'sports', label: 'Basketball · Rookie Cards', base: 100,
    index: ok(108.5, prov('medium', 22)), change24h: -0.6, deltas: { d7: -0.6, d30: 2.1, d365: 9.3 },
    listings: 3105, sourceLabel: 'RENAISS INDEX', verifiedSales90d: 410, salesThreshold: 25, updatedAt: AS_OF,
    sparkline: sportsSeries.slice(-14), series: sportsSeries,
    constituents: [
      // rank-1 dominates → concentrated market
      constituent(1, 'Michael Jordan RC', 'Fleer', '57', '10', 900_000, 0.4, ok(usd(900_000), prov('high', 26))),
      constituent(2, 'LeBron James RC', 'Topps Chrome', '111', '10', 60_000, -1.2, ok(usd(60_000), prov('medium', 10))),
      constituent(3, 'Kobe Bryant RC', 'Topps', '138', '10', 45_000, 0.8, ok(usd(45_000), prov('medium', 8))),
      constituent(4, 'Luka Dončić RC (Silver)', 'Prizm', '280', '10', 30_000, -0.3, ok(usd(30_000), prov('low', 5))),
    ],
    sales: [sale(2, 905_000, 'transaction', '10', V.goldin), sale(3, 59_000, 'listing', '10', V.ebay), sale(6, 44_000, 'transaction', '10', V.pwcc), sale(9, 31_000, 'transaction', '10', V.fanatics)],
  },
  {
    id: 'sports-vintage', code: 'MLB', game: 'sports', label: 'Baseball · Vintage', base: 100,
    index: ok(96.4, prov('medium', 20)), change24h: -1.4, deltas: { d7: -1.4, d30: -3.2, d365: 4.1 },
    listings: 1937, sourceLabel: 'AUCTION FEED', verifiedSales90d: 260, salesThreshold: 25, updatedAt: AS_OF,
    sparkline: sportsVintageSeries.slice(-14), series: sportsVintageSeries,
    constituents: [
      constituent(1, 'Mickey Mantle', '1952 Topps', '311', '8', 620_000, -0.9, ok(usd(620_000), prov('high', 16))),
      constituent(2, 'Willie Mays RC', '1951 Bowman', '305', '7', 240_000, -1.1, ok(usd(240_000), prov('medium', 9))),
      constituent(3, 'Hank Aaron RC', '1954 Topps', '128', '8', 180_000, -0.6, ok(usd(180_000), prov('medium', 8))),
      constituent(4, 'Roberto Clemente RC', '1955 Topps', '164', '7', 90_000, -2.0, ok(usd(90_000), prov('low', 6))),
    ],
    sales: [sale(2, 618_000, 'transaction', '8', V.heritage), sale(4, 178_000, 'transaction', '8', V.goldin), sale(5, 238_000, 'listing', '7', V.pwcc), sale(10, 88_000, 'transaction', '7', V.heritage)],
  },
  {
    id: 'lorcana', code: 'LOR', game: 'lorcana', label: 'Lorcana · First Chapter', base: 100,
    // THIN: below MIN_SAMPLE → the index is INSUFFICIENT, not a fabricated number.
    index: insufficient(prov('low', 2)), change24h: null, deltas: { d7: null, d30: null, d365: null },
    listings: 37, sourceLabel: 'HOUSE REPORTS', verifiedSales90d: 11, salesThreshold: 25, updatedAt: AS_OF,
    sparkline: lorcanaSeries, series: lorcanaSeries,
    constituents: [
      constituent(1, 'Elsa — Snow Queen (Enchanted)', 'The First Chapter', '42', '10', 25_000, null, insufficient(prov('low', 2))),
    ],
    sales: [sale(4, 24_000, 'listing', '10', V.ebay)],
  },
]

export const SEED_BY_ID: Record<string, Seed> = Object.fromEntries(SEEDS.map((s) => [s.id, s]))
export const SEED_IDS = SEEDS.map((s) => s.id)

/** Project a seed record to a Category tile. */
export function toTile(s: Seed): Category {
  return {
    id: s.id,
    code: s.code,
    game: s.game,
    label: s.label,
    index: s.index,
    base: s.base,
    change24h: s.change24h,
    deltas: s.deltas,
    constituentCount: s.constituents.length,
    listings: s.listings,
    sparkline: s.sparkline,
    sourceLabel: s.sourceLabel,
    verifiedSales90d: s.verifiedSales90d,
    salesThreshold: s.salesThreshold,
    updatedAt: s.updatedAt,
  }
}

/** Project a seed record to a full CategoryDetail. */
export function toDetail(s: Seed): import('./schema').CategoryDetail {
  return { ...toTile(s), constituents: s.constituents, recentSales: s.sales }
}
