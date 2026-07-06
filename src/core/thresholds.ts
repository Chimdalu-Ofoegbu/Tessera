/**
 * Shared "is there enough data?" thresholds. Pure, no I/O (this file lives in
 * `src/core`, which never imports anything with side effects).
 *
 * These placeholders are finalized in Phase 2 against the seed fixtures so the
 * deliberately-thin category trips INSUFFICIENT_DATA live during the demo.
 */

/** Minimum observations for a metric to be considered sufficient. */
export const MIN_SAMPLE = 5

/** Freshness ceiling (days) before a metric is treated as stale. */
export const MAX_STALE_DAYS = 30

/** Version tag stamped alongside any score/index that depends on these thresholds. */
export const THRESHOLDS_VERSION = 'thresholds@0.1.0'
