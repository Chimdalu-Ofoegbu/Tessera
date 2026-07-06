/**
 * Normalized entity schemas — the single source of truth for data shapes.
 * zod schemas define validation; `z.infer` derives the TypeScript types. Field
 * names mirror the real Renaiss Index API (see .planning/research/RENAISS-API.md)
 * so mock and real sources are honest and interchangeable.
 */
import { z } from 'zod'

export const GameSchema = z.enum(['pokemon', 'one-piece', 'sports'])
export const ConfidenceSchema = z.enum(['high', 'medium', 'low'])
export const SourceIdSchema = z.enum(['seed', 'renaiss'])

/** The provenance envelope: the four descriptor fields required on every metric. */
export const ProvenanceSchema = z.object({
  source: SourceIdSchema,
  asOf: z.string(),
  confidence: ConfidenceSchema,
  sampleSize: z.number().int().min(0),
})

/**
 * Wrap any value schema in the Metric envelope. A parsed metric is either
 * `{ ok:true, value, provenance }` or `{ ok:false, insufficient:true, provenance }`.
 * A bare value or a value missing provenance fails validation.
 */
export const metricSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.discriminatedUnion('ok', [
    z.object({ ok: z.literal(true), value: inner, provenance: ProvenanceSchema }),
    z.object({ ok: z.literal(false), insufficient: z.literal(true), provenance: ProvenanceSchema }),
  ])

export const MoneySchema = z.object({
  cents: z.number().int(),
  currency: z.string().default('USD'),
})

export const DeltasSchema = z.object({
  d7: z.number().nullable(),
  d30: z.number().nullable(),
  d365: z.number().nullable(),
})

export const PricePointSchema = z.object({
  t: z.string(),
  usdCents: z.number().int().min(0),
  n: z.number().int().min(0),
  kind: z.enum(['transaction', 'listing']).nullable(),
  source: SourceIdSchema,
  bucket: z.string().nullable(),
})

export const SaleSchema = z.object({
  observedAt: z.string(),
  kind: z.enum(['transaction', 'listing']),
  price: MoneySchema,
  source: z.string(),
  company: z.string().nullable(),
  grade: z.string().nullable(),
  gradeLabel: z.string().nullable(),
})

export const ConstituentSchema = z.object({
  rank: z.number().int().min(1),
  name: z.string(),
  setName: z.string().nullable(),
  cardNumber: z.string().nullable(),
  grade: z.string().nullable(),
  price: metricSchema(MoneySchema),
  deltaPct: z.number().nullable(),
  lastSaleAt: z.string().nullable(),
})

/** A category tile. `index` is a Metric<number> so a thin category surfaces insufficiency at the tile level; `base` is the rebase anchor (100). */
export const CategorySchema = z.object({
  id: z.string(),
  game: z.string(),
  label: z.string(),
  index: metricSchema(z.number()),
  base: z.number(),
  deltas: DeltasSchema,
  constituentCount: z.number().int().min(0),
  sparkline: z.array(PricePointSchema),
  updatedAt: z.string(),
})

export const CategoryDetailSchema = CategorySchema.extend({
  constituents: z.array(ConstituentSchema),
  recentSales: z.array(SaleSchema),
})

export type Game = z.infer<typeof GameSchema>
export type Money = z.infer<typeof MoneySchema>
export type Deltas = z.infer<typeof DeltasSchema>
export type PricePoint = z.infer<typeof PricePointSchema>
export type Sale = z.infer<typeof SaleSchema>
export type Constituent = z.infer<typeof ConstituentSchema>
export type Category = z.infer<typeof CategorySchema>
export type CategoryDetail = z.infer<typeof CategoryDetailSchema>
export type Window = 7 | 30 | 90 | 365
