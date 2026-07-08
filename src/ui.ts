import type React from 'react'

/** Shared UI actions/state passed to screens + components (avoids deep prop trees). */
export interface UI {
  dark: boolean
  theme: 'dark' | 'light'
  motion: boolean
  watch: string[]
  isWatched: (id: string) => boolean
  toggleWatch: (id: string, e?: React.MouseEvent) => void
  openCat: (id: string) => void
  goHome: () => void
  goOverview: () => void
  toggleDrawer: () => void
  q: string
  setQ: (s: string) => void
}

export type Screen = 'home' | 'overview' | 'detail'
