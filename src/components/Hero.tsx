import { useEffect, useRef, useState } from 'react'
import { useOverview } from '@/api/hooks'
import { isOk, fmtNum, fmtInt, pct, arrow, srcLine, timeUTC } from '@/lib/view'
import type { HeroCard } from '@/three/heroScene'
import type { UI } from '@/ui'

const mono = 'var(--f-mono)'

/** $8.3K / $1.2M style — the live floor value is thousands today; a fixed M format would show $0.0M. */
const fmtUsdShort = (v: number): string => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}K` : `$${Math.round(v)}`)

function useCountUp(target: number, motion: boolean, dur = 1900): number {
  const [v, setV] = useState(motion ? 0 : target)
  useEffect(() => {
    if (!motion) { setV(target); return }
    let raf = 0
    const t0 = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      setV(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, motion, dur])
  return v
}

function Counter({ big, label, src }: { big: string; label: string; src: string }) {
  return (
    <div style={{ padding: '0 26px', textAlign: 'left', borderLeft: '1px solid rgba(27,23,16,.16)' }}>
      <div style={{ font: `500 30px ${mono}`, color: '#1B1710' }}>{big}</div>
      <div style={{ font: `500 9.5px ${mono}`, letterSpacing: '.18em', color: '#6E6759', marginTop: 5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 9px ${mono}`, letterSpacing: '.1em', color: '#6E6759', marginTop: 4 }}>
        <span style={{ width: 4, height: 4, background: '#2E8065', borderRadius: '50%' }} />
        {src}
      </div>
    </div>
  )
}

export function Hero({ ui }: { ui: UI }) {
  const { data } = useOverview()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cats = data?.categories ?? []

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || cats.length === 0) return
    const heroCards: HeroCard[] = data.categories.slice(0, 8).map((c) => ({
      code: c.code,
      name: c.label,
      idx: isOk(c.index) ? fmtNum(c.index.value) : '—',
      chg: c.change24h != null ? `${arrow(c.change24h)} ${pct(c.change24h)}` : '',
      up: (c.change24h ?? 0) >= 0,
      scored: isOk(c.index),
      spark: c.sparkline.map((p) => p.usdCents),
      src: srcLine(c.sourceLabel, c.updatedAt),
    }))
    let scene: { dispose: () => void } | null = null
    let alive = true
    const start = async () => {
      if (!alive || !canvasRef.current) return
      // Lazy-load Three.js so it isn't in the initial bundle (only the hero needs it).
      const { createHeroScene } = await import('@/three/heroScene')
      if (alive && canvasRef.current) scene = createHeroScene(canvasRef.current, heroCards, { motion: ui.motion, onOpen: ui.openCat })
    }
    if (document.fonts?.ready) document.fonts.ready.then(() => void start()).catch(() => void start())
    else void start()
    return () => {
      alive = false
      scene?.dispose()
    }
  }, [data, cats.length, ui.motion, ui.openCat])

  const upd = data ? timeUTC(data.asOf) : ''
  const volUsd = useCountUp(data ? data.totalVolume.cents / 100 : 0, ui.motion)
  const listings = useCountUp(data ? data.totalListings : 0, ui.motion)
  const count = useCountUp(cats.length, ui.motion)
  const tick = [...cats, ...cats]

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 60px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'radial-gradient(120% 60% at 18% -8%,rgba(201,169,97,.12),rgba(242,237,227,0) 55%),radial-gradient(90% 50% at 88% -4%,rgba(46,128,101,.07),rgba(242,237,227,0) 50%),#F2EDE3' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 2, pointerEvents: 'none', flex: 1, width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'calc(7vh + 72px) 32px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h1 style={{ pointerEvents: 'auto', margin: '30px 0 0', font: '800 clamp(24px,5.7vw - 4px,72px)/1.06 var(--f-display)', fontStretch: '118%', letterSpacing: '-.028em', textTransform: 'uppercase', color: '#1B1710' }} className="rise">
          <span style={{ whiteSpace: 'nowrap' }}>The collector</span>
          <br />
          <span style={{ whiteSpace: 'nowrap' }}>economy, made <em style={{ font: 'italic 300 .95em var(--f-display)', color: '#8A6D1F', letterSpacing: '-.01em', textTransform: 'none' }}>Legible</em>.</span>
        </h1>
        <div style={{ pointerEvents: 'auto', marginTop: 22, maxWidth: 600, font: '400 16.5px/1.6 var(--f-display)', color: '#4C4638' }} className="rise">
          Verified-sales intelligence for real-world collectibles — powered by the Renaiss Index. Live category indices, risk scores that show their work, and a source on every number.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 26, width: 230 }} className="rise">
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(143,111,38,0),rgba(143,111,38,.6))' }} />
          <div style={{ width: 5, height: 5, transform: 'rotate(45deg)', background: '#C9A961' }} />
          <div style={{ width: 5, height: 5, transform: 'rotate(45deg)', border: '1px solid rgba(143,111,38,.7)' }} />
          <div style={{ width: 5, height: 5, transform: 'rotate(45deg)', background: '#C9A961' }} />
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(143,111,38,.6),rgba(143,111,38,0))' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 30 }}>
          <button className="btn-primary" onClick={ui.goOverview} style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, font: '700 15px var(--f-display)', letterSpacing: '.01em', padding: '14px 26px' }}>
            Enter Terminal →
          </button>
        </div>
        <div style={{ pointerEvents: 'auto', marginTop: 92, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }} className="rise">
          <div style={{ padding: '0 26px', textAlign: 'left' }}>
            <div style={{ font: `500 30px ${mono}`, color: '#1B1710' }}>{fmtUsdShort(volUsd)}</div>
            <div style={{ font: `500 9.5px ${mono}`, letterSpacing: '.18em', color: '#6E6759', marginTop: 5 }}>FLOOR VALUE — LISTINGS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 9px ${mono}`, letterSpacing: '.1em', color: '#6E6759', marginTop: 4 }}>
              <span style={{ width: 4, height: 4, background: '#2E8065', borderRadius: '50%' }} />SRC RENAISS INDEX · UPD {upd}
            </div>
          </div>
          <Counter big={fmtInt(listings)} label="ACTIVE LISTINGS" src={`SRC RENAISS INDEX · UPD ${upd}`} />
          <Counter big={String(Math.round(count))} label="CATEGORY INDICES" src={`SRC RENAISS INDEX · UPD ${upd}`} />
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(27,23,16,.16)', background: 'rgba(250,247,240,.8)', backdropFilter: 'blur(5px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', width: 'max-content', animation: ui.motion ? 'marqueeX 38s linear infinite' : 'none' }}>
          {tick.map((c, i) => (
            <div key={i} className="mover-row" onClick={() => ui.openCat(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 22px', cursor: 'pointer', font: `500 10px ${mono}`, letterSpacing: '.14em', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#8A6D1F', fontWeight: 600 }}>{c.code}</span>
              <span style={{ color: isOk(c.index) ? ((c.change24h ?? 0) >= 0 ? '#256B57' : '#A8442F') : '#6E6759' }}>
                {isOk(c.index) ? `${arrow(c.change24h)} ${c.change24h != null ? pct(c.change24h) : ''}` : 'BELOW THRESHOLD'}
              </span>
              <span style={{ width: 4, height: 4, transform: 'rotate(45deg)', background: 'rgba(143,111,38,.5)', marginLeft: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
