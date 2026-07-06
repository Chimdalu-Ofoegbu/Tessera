import type { Category, CategoryDetail, PricePoint, Sale, Window } from './schema'
import type { Metric, SourceId } from './metric'

/** A top-mover row for the overview. */
export interface Mover {
  id: string
  label: string
  deltaPct: number | null
  index: Metric<number>
}

/** Source liveness. */
export interface Health {
  ok: boolean
  source: SourceId
}

/**
 * The data-layer PORT. One interface, many implementations (MockSource now,
 * RenaissSource next). Consumers depend only on this port + the normalized
 * schema — never on a concrete source or on fixtures.
 *
 * Entity model — reconciles the ROADMAP's "Category, Collectible/Listing, Sale,
 * PricePoint" success-criterion entities to this codebase's names:
 * - `Category`    → an index tile (a game: pokemon | one-piece | sports).
 * - `Constituent` → a collectible (a graded card) inside a category; surfaced on `CategoryDetail`.
 * - `Sale`        → a transaction OR a listing (`kind: 'transaction' | 'listing'`).
 * - `PricePoint`  → one point on the index/price time-series.
 *
 * Aggregate methods return the `insufficient` branch when data is too thin;
 * `getCategory` throws only for an unknown id.
 */
export interface DataSource {
  getCategories(): Promise<Category[]>
  getCategory(id: string): Promise<CategoryDetail>
  getIndexSeries(id: string, window: Window): Promise<Metric<PricePoint[]>>
  getRecentSales(id: string, limit?: number): Promise<Sale[]>
  getFeaturedMovers(limit?: number): Promise<Mover[]>
  health(): Promise<Health>
}
