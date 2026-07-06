/**
 * Shared "is there enough data?" thresholds. Pure, no I/O (this file lives in
 * `src/core`, which never imports anything with side effects).
 *
 * v1 values (finalized in Phase 2, `risk@1.0.0` / `index@1.0.0`), tuned against the
 * seed fixtures so the deliberately-thin category trips INSUFFICIENT_DATA live in the demo.
 */

/** Minimum observations for a metric to be considered sufficient. */
export const MIN_SAMPLE = 5

/** Freshness ceiling (days) before a metric is treated as stale. */
export const MAX_STALE_DAYS = 30

/** Minimum sales (`n`) at a single series point before it counts (else it is a gap). */
export const MIN_POINT_SAMPLE = 2

/** Version tag stamped alongside any score/index that depends on these thresholds. */
export const THRESHOLDS_VERSION = 'thresholds@0.1.0'

/** Risk engine version — stamped on every risk result (deterministic + versioned). */
export const RISK_ENGINE_VERSION = 'risk@1.0.0'

/** Index engine version — stamped on every index result. */
export const INDEX_ENGINE_VERSION = 'index@1.0.0'
