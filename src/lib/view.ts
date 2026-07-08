/**
 * View-model helpers — presentation only. Maps the truthful API payloads
 * (provenance-wrapped metrics + the engine's RiskBreakdown) onto the Gilded
 * Terminal design: formatting, tier colors, confidence band, chart SVG paths,
 * and the four "goodness" risk meters. Formulas match the design handoff.
 */
import { isOk, type Metric } from '@/data/metric'
import type { Money } from '@/data/schema'
import type { RiskBreakdown } from '@/core/risk'

export { isOk }

/* ---------- formatting ---------- */
export const fmtNum = (n: number, dp = 1): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })

export const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US')

/** Money from integer cents → "$X.XXM" / "$X.XK" / "$N". */
export function money(cents: number): string {
  const n = cents / 100
  return n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : '$' + Math.round(n).toLocaleString('en-US')
}

export const pct = (n: number): string => (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
export const arrow = (n: number | null): string => (n == null ? '' : n >= 0 ? '▲' : '▼')

/** Freshness timestamp → "HH:MM UTC". */
export function timeUTC(asOf: string): string {
  const d = new Date(asOf)
  if (isNaN(d.getTime())) return asOf
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm} UTC`
}
export const srcLine = (label: string, asOf: string): string => `SRC ${label} · UPD ${timeUTC(asOf)}`

/* ---------- change colors ---------- */
export const changeColor = (n: number | null, dark: boolean): string =>
  n == null ? (dark ? '#8B8271' : '#6E6759') : n >= 0 ? (dark ? '#74A784' : '#256B57') : (dark ? '#BC6A5B' : '#A8442F')

/* ---------- risk tiers ---------- */
export interface TierInfo {
  tier: string
  color: string
  border: string
}
export function tierInfo(score: number, dark: boolean): TierInfo {
  if (dark) {
    if (score < 35) return { tier: 'LOW', color: '#74A784', border: 'rgba(116,167,132,.45)' }
    if (score < 55) return { tier: 'MODERATE', color: '#C9A961', border: 'rgba(201,169,97,.45)' }
    if (score < 75) return { tier: 'ELEVATED', color: '#C9853F', border: 'rgba(201,133,63,.5)' }
    return { tier: 'HIGH', color: '#BC5F52', border: 'rgba(188,95,82,.5)' }
  }
  if (score < 35) return { tier: 'LOW', color: '#256B57', border: 'rgba(37,107,87,.45)' }
  if (score < 55) return { tier: 'MODERATE', color: '#8A6D1F', border: 'rgba(138,109,31,.45)' }
  if (score < 75) return { tier: 'ELEVATED', color: '#A05C1B', border: 'rgba(160,92,27,.45)' }
  return { tier: 'HIGH', color: '#A8442F', border: 'rgba(168,68,47,.45)' }
}

/* ---------- risk display (engine RiskBreakdown → design panel) ---------- */
export interface RiskFactorView {
  k: string
  v: number
  def: string
}
export interface RiskView {
  score: number
  tier: TierInfo
  bandLo: number
  bandHi: number
  conf: number
  factors: RiskFactorView[]
}
const r0 = (x: number) => Math.round(x)
/**
 * The engine emits RISK contributions (higher = riskier). The design shows the
 * four factors as levels with per-factor "higher/lower is better" semantics:
 * liquidity & data-confidence are inverted (goodness = 100 − risk); volatility &
 * concentration are shown as-is (higher value = worse). The headline score keeps
 * the engine's direction (0–100, higher = riskier ⇒ "lower is safer").
 */
export function riskView(rb: RiskBreakdown, dark: boolean): RiskView {
  const liq = 100 - r0(rb.factors.liquidity.raw)
  const vol = r0(rb.factors.volatility.raw)
  const con = r0(rb.factors.concentration.raw)
  const conf = 100 - r0(rb.factors.dataConfidence.raw)
  return {
    score: rb.score,
    tier: tierInfo(rb.score, dark),
    bandLo: Math.max(0, rb.score - rb.band),
    bandHi: Math.min(100, rb.score + rb.band),
    conf,
    factors: [
      { k: 'LIQUIDITY', v: liq, def: 'Depth of active bids & median time-to-sale. Higher is better.' },
      { k: 'VOLATILITY', v: vol, def: 'Dispersion of realized prices vs the 90-day trend. Lower is better.' },
      { k: 'CONCENTRATION', v: con, def: 'Share of category value held by the top constituents. Lower is better.' },
      { k: 'DATA CONFIDENCE', v: conf, def: 'Verified coverage of source records. Higher is better.' },
    ],
  }
}

/* ---------- chart SVG paths (design line/area generators) ---------- */
export function linePath(values: number[], w: number, h: number, p: number): string {
  if (values.length === 0) return ''
  const mn = Math.min(...values)
  const mx = Math.max(...values)
  const sp = mx - mn || 1
  const denom = values.length === 1 ? 1 : values.length - 1
  return values
    .map((v, i) => (i ? 'L' : 'M') + (p + (i * (w - 2 * p)) / denom).toFixed(1) + ' ' + (h - p - ((v - mn) / sp) * (h - 2 * p)).toFixed(1))
    .join(' ')
}
export function areaPath(values: number[], w: number, h: number, p: number): string {
  const l = linePath(values, w, h, p)
  return l ? `${l} L${(w - p).toFixed(1)} ${(h - p).toFixed(1)} L${p} ${(h - p).toFixed(1)} Z` : ''
}

/** Money helper for cents. */
export const centsToMoney = (m: Metric<Money>): string => (isOk(m) ? money(m.value.cents) : '—')
