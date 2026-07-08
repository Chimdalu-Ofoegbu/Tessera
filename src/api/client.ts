import type { Overview, CategoryAnalytics } from '@/lib/compute'

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return (await res.json()) as T
}

// Static JSON snapshots (generated to public/api/) — served from the CDN in prod;
// the Vite dev middleware serves the same shapes dynamically for the same paths.
export const getOverview = () => getJSON<Overview>('/api/overview.json')
export const getCategory = (id: string) => getJSON<CategoryAnalytics>(`/api/categories/${encodeURIComponent(id)}.json`)

export type { Overview, CategoryAnalytics }
