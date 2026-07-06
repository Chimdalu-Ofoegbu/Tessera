import type { DataSource } from './DataSource'
import { MockSource } from './mock/MockSource'
import { RenaissSource } from './renaiss/RenaissSource'

/** Opt into the real Renaiss adapter via USE_RENAISS=1 or by providing partner credentials. */
function useRenaiss(): boolean {
  const env = typeof process !== 'undefined' ? process.env : undefined
  if (!env) return false
  if (env.USE_RENAISS === '1') return true
  return Boolean(env.RENAISS_API_KEY && env.RENAISS_API_SECRET)
}

/**
 * The SINGLE wiring point for the data layer. `MockSource` is the demo-safe
 * default; `RenaissSource` is opt-in. This function is the ONLY place a source
 * is constructed — the entire mock→real swap lives on the line below. (DATA-02)
 */
export function getDataSource(): DataSource {
  return useRenaiss() ? new RenaissSource() : new MockSource()
}
