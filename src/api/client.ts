import type { Overview, CategoryAnalytics } from '@/lib/compute'

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return (await res.json()) as T
}

export const getOverview = () => getJSON<Overview>('/api/overview')
export const getCategory = (id: string) => getJSON<CategoryAnalytics>(`/api/categories/${encodeURIComponent(id)}`)

export type { Overview, CategoryAnalytics }
