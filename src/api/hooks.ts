import { useQuery } from '@tanstack/react-query'
import { getOverview, getCategory } from './client'

export const useOverview = () =>
  useQuery({ queryKey: ['overview'], queryFn: getOverview, staleTime: 60_000 })

export const useCategory = (id: string | null) =>
  useQuery({ queryKey: ['category', id], queryFn: () => getCategory(id as string), enabled: !!id, staleTime: 60_000 })
