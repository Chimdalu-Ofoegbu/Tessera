/**
 * Risk engine — Tessera's core innovation and its "no black box" guarantee.
 * Pure, deterministic, versioned. Implements 02-METHODOLOGY.md exactly: a 0–100
 * composite of four transparent factors whose weighted contributions reconcile
 * to the headline score, plus a confidence band, plus first-class insufficiency.
 * No I/O, no randomness, no wall clock (`now` is injected).
 */
import { insufficient, ok, type Confidence, type Metric, type Provenance, type SourceId } from '../data/metric'
import type { PricePoint } from '../data/schema'
import { MAX_STALE_DAYS, MIN_SAMPLE, RISK_ENGINE_VERSION } from './thresholds'

const DAY = 86_400_000
const TARGET_OBS = 40
const COV_CAP = 0.4
const WEIGHTS = { liquidity: 0.3, volatility: 0.3, concentration: 0.25, dataConfidence: 0.15 } as const

const clamp = (x: number, lo = 0, hi = 100): number => Math.min(hi, Math.max(lo, x))
const round = (x: number): number => Math.round(x)
const round2 = (x: number): number => Math.round(x * 100) / 100

export interface RiskFactor {
  raw: number
  weight: number
  contribution: number
}
export interface RiskBreakdown {
  score: number
  factors: {
    liquidity: RiskFactor
    volatility: RiskFactor
    concentration: RiskFactor
    dataConfidence: RiskFactor
  }
  band: number
  version: string
}
export interface RiskInput {
  series: PricePoint[]
  constituentValuesCents: number[]
  sampleSize: number
  confidence: Confidence
  asOf: string
  source: SourceId
  now: number
}

/** Fewer total observed sales → higher liquidity risk. */
export function liquidityRisk(totalObs: number): number {
  return clamp(100 * (1 - Math.min(totalObs, TARGET_OBS) / TARGET_OBS))
}

/** Higher price dispersion (coefficient of variation) → higher volatility risk. */
export function volatilityRisk(prices: number[]): number {
  if (prices.length < 2) return 0
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length
  if (mean <= 0) return 0
  const variance = prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length
  const cov = Math.sqrt(variance) / mean
  return clamp((100 * Math.min(cov, COV_CAP)) / COV_CAP)
}

/** Value concentrated in few constituents (Herfindahl index) → higher concentration risk. */
export function concentrationRisk(valuesCents: number[]): number {
  const vals = valuesCents.filter((v) => v > 0)
  const n = vals.length
  if (n <= 1) return 100
  const total = vals.reduce((a, b) => a + b, 0)
  if (total <= 0) return 100
  const hhi = vals.reduce((a, v) => a + (v / total) ** 2, 0)
  return clamp((100 * (hhi - 1 / n)) / (1 - 1 / n))
}

/** Low confidence / thin sample / stale data → higher data-confidence risk. */
export function dataConfidenceRisk(confidence: Confidence, sampleSize: number, staleDays: number): number {
  const base = confidence === 'high' ? 10 : confidence === 'medium' ? 40 : 75
  const sparse = sampleSize < MIN_SAMPLE ? 25 : sampleSize < 15 ? 10 : 0
  const stale = staleDays > MAX_STALE_DAYS ? 20 : staleDays > 14 ? 8 : 0
  return clamp(base + sparse + stale)
}

function bandFor(confidence: Confidence, sampleSize: number, staleDays: number): number {
  const BASE_BAND = 6
  const confMult = confidence === 'high' ? 0 : confidence === 'medium' ? 0.5 : 1.2
  const sparseMult = sampleSize < MIN_SAMPLE ? 1 : sampleSize < 15 ? 0.4 : 0
  const staleMult = staleDays > MAX_STALE_DAYS ? 0.5 : 0
  return round(BASE_BAND * (1 + confMult + sparseMult + staleMult))
}

export function computeRisk(input: RiskInput): Metric<RiskBreakdown> {
  const { series, constituentValuesCents, sampleSize, confidence, asOf, source, now } = input
  const prov: Provenance = { source, asOf, confidence, sampleSize }
  const totalObs = series.reduce((a, p) => a + (p.n ?? 0), 0)

  // Insufficient guard FIRST (RISK-05) — no fabricated score on thin data.
  if (series.length < MIN_SAMPLE || totalObs < MIN_SAMPLE || (confidence === 'low' && sampleSize < MIN_SAMPLE)) {
    return insufficient(prov)
  }

  const staleDays = Math.max(0, (now - Date.parse(asOf)) / DAY)
  const prices = series.map((p) => p.usdCents)

  const factor = (raw: number, weight: number): RiskFactor => ({
    raw: round2(raw),
    weight,
    contribution: round2(weight * round2(raw)),
  })
  const factors = {
    liquidity: factor(liquidityRisk(totalObs), WEIGHTS.liquidity),
    volatility: factor(volatilityRisk(prices), WEIGHTS.volatility),
    concentration: factor(concentrationRisk(constituentValuesCents), WEIGHTS.concentration),
    dataConfidence: factor(dataConfidenceRisk(confidence, sampleSize, staleDays), WEIGHTS.dataConfidence),
  }
  const score = clamp(
    round(
      factors.liquidity.contribution +
        factors.volatility.contribution +
        factors.concentration.contribution +
        factors.dataConfidence.contribution,
    ),
  )
  const band = bandFor(confidence, sampleSize, staleDays)
  return ok({ score, factors, band, version: RISK_ENGINE_VERSION }, prov)
}
