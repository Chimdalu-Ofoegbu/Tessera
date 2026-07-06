/**
 * The metric contract — the heart of Tessera's "no bare numbers" guarantee.
 *
 * DATA-03 / ROADMAP specify the on-the-wire envelope:
 *   { value | insufficient, confidence, sampleSize, source, asOf }
 *
 * We model that as `Metric<T>`: the `ok` discriminant carries `value` (or marks
 * the metric `insufficient`), and the four descriptor fields — source, asOf,
 * confidence, sampleSize — live together on `provenance`. `Provenance` IS that
 * envelope descriptor. Every branch REQUIRES `provenance`, so a value can never
 * exist without it, and INSUFFICIENT_DATA is a first-class, representable outcome.
 */

export type Confidence = 'high' | 'medium' | 'low'
export type SourceId = 'seed' | 'renaiss'

/**
 * The provenance envelope: exactly the `{ source, asOf, confidence, sampleSize }`
 * descriptor DATA-03 requires on every metric. `asOf` is data freshness (an ISO
 * 8601 timestamp from the source), never a render-time clock.
 */
export interface Provenance {
  source: SourceId
  asOf: string
  confidence: Confidence
  sampleSize: number
}

/** A value that always carries provenance, or an explicit insufficient-data outcome. */
export type Metric<T> =
  | { ok: true; value: T; provenance: Provenance }
  | { ok: false; insufficient: true; provenance: Provenance }

/** Construct a present metric. Provenance is mandatory — a value cannot exist without it. */
export const ok = <T>(value: T, provenance: Provenance): Metric<T> => ({
  ok: true,
  value,
  provenance,
})

/** Construct an explicit insufficient-data metric (thin/stale/low-confidence source). */
export const insufficient = <T>(provenance: Provenance): Metric<T> => ({
  ok: false,
  insufficient: true,
  provenance,
})

/** Narrow a metric to its present branch. */
export const isOk = <T>(m: Metric<T>): m is Extract<Metric<T>, { ok: true }> => m.ok
