/**
 * Tiny in-memory TTL memo cache for assembled API payloads. Keeps repeated
 * requests identical and instant, and shields the (rate-limited) upstream
 * source. `now` is injected so tests are deterministic.
 */
interface Entry {
  at: number
  value: unknown
}
const store = new Map<string, Entry>()

export async function memo<T>(key: string, ttlMs: number, now: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key)
  if (hit && now - hit.at < ttlMs) return hit.value as T
  const value = await fn()
  store.set(key, { at: now, value })
  return value
}

/** For tests: reset the memo cache. */
export function clearComputeCache(): void {
  store.clear()
}
