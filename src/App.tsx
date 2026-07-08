import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import type { Screen, UI } from './ui'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Overview } from './components/Overview'
import { Detail } from './components/Detail'
import { WatchlistDrawer } from './components/WatchlistDrawer'
import { Footer } from './components/Footer'

const readLS = (k: string, fallback: string): string => {
  try {
    return localStorage.getItem(k) ?? fallback
  } catch {
    return fallback
  }
}
const readWatch = (): string[] => {
  try {
    const raw = localStorage.getItem('tesseraWatch')
    if (raw) return JSON.parse(raw) as string[]
  } catch {
    /* ignore */
  }
  return ['one-piece', 'sports']
}

function usePrefersReducedMotion(): boolean {
  const [rm, setRm] = useState(false)
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setRm(mq.matches)
    const on = () => setRm(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return rm
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [cat, setCat] = useState<string>('pokemon')
  const [q, setQ] = useState('')
  const [drawer, setDrawer] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (readLS('tesseraTheme', 'dark') === 'light' ? 'light' : 'dark'))
  const [watch, setWatch] = useState<string[]>(() => readWatch())
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    try {
      localStorage.setItem('tesseraTheme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])
  useEffect(() => {
    try {
      localStorage.setItem('tesseraWatch', JSON.stringify(watch))
    } catch {
      /* ignore */
    }
  }, [watch])

  const openCat = useCallback((id: string) => {
    setCat(id)
    setScreen('detail')
    setDrawer(false)
    window.scrollTo(0, 0)
  }, [])
  const goHome = useCallback(() => {
    setScreen('home')
    setDrawer(false)
    window.scrollTo(0, 0)
  }, [])
  const goOverview = useCallback(() => {
    setScreen('overview')
    setDrawer(false)
    window.scrollTo(0, 0)
  }, [])

  const ui = useMemo<UI>(
    () => ({
      dark: theme === 'dark',
      theme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      motion: !reduced,
      watch,
      isWatched: (id) => watch.includes(id),
      toggleWatch: (id, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setWatch((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]))
      },
      openCat,
      goHome,
      goOverview,
      toggleDrawer: () => setDrawer((d) => !d),
      q,
      setQ,
    }),
    [theme, reduced, watch, q, openCat, goHome, goOverview],
  )

  return (
    <>
      <Nav ui={ui} screen={screen} />
      {screen === 'home' && (
        <>
          <Hero ui={ui} />
          <Footer ui={ui} />
        </>
      )}
      {screen === 'overview' && <Overview ui={ui} />}
      {screen === 'detail' && <Detail ui={ui} catId={cat} />}
      {drawer && <WatchlistDrawer ui={ui} />}
    </>
  )
}
