import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import type { Screen, UI } from './ui'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Overview } from './components/Overview'
import { Detail } from './components/Detail'
import { WatchlistDrawer } from './components/WatchlistDrawer'
import { Footer } from './components/Footer'

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
  // Watchlist is session-only: empty for every visitor, held in React state (no
  // localStorage/sessionStorage). It survives in-app navigation (this is a SPA, so
  // moving between screens never reloads), but any full page reload or a cookie /
  // site-data clear resets it to empty. Browsers don't expose hard-vs-soft reload to
  // JS, so "clear on hard refresh" is delivered as "clear on any full reload".
  const [watch, setWatch] = useState<string[]>([])
  const reduced = usePrefersReducedMotion()

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
      dark: false,
      theme: 'light',
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
    [reduced, watch, q, openCat, goHome, goOverview],
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
