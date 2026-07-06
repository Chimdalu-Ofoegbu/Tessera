import type { DataSource } from './DataSource'
import { MockSource } from './mock/MockSource'

/**
 * The SINGLE wiring point for the data layer. Consumers call `getDataSource()`
 * and never construct a source directly. `MockSource` is the demo-safe default;
 * plan 01-04 adds the `RenaissSource` branch here — the only line that changes
 * to go from mock to real data.
 */
export function getDataSource(): DataSource {
  return new MockSource()
}
