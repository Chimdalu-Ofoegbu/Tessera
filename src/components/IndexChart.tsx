import { useMemo, useState } from 'react'
import { isOk, linePath, areaPath, fmtNum } from '@/lib/view'
import type { UI } from '@/ui'
import type { CategoryAnalytics } from '@/lib/compute'

const mono = 'var(--f-mono)'
const DAY = 86_400_000
const RANGES = [
  { k: '30D', days: 30 },
  { k: '90D', days: 90 },
  { k: '1Y', days: 365 },
] as const
type RangeKey = (typeof RANGES)[number]['k']

function dateLabel(iso: string): string {
  const d = new Date(iso)
  const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MON[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`
}

export function IndexChart({ ui, a, loading, range, setRange }: { ui: UI; a: CategoryAnalytics; loading: boolean; range: RangeKey; setRange: (k: RangeKey) => void }) {
  const [tip, setTip] = useState<{ x: number; y: number; v: number; d: string } | null>(null)

  const pts = useMemo(() => {
    if (!isOk(a.indexSeries)) return []
    const all = a.indexSeries.value.points.filter((p) => p.value !== null) as { t: string; value: number; n: number }[]
    const days = RANGES.find((r) => r.k === range)?.days ?? 90
    if (all.length === 0) return all
    const cutoff = Date.parse(all[all.length - 1].t) - days * DAY
    const sliced = all.filter((p) => Date.parse(p.t) >= cutoff)
    return sliced.length >= 2 ? sliced : all
  }, [a.indexSeries, range])

  const values = pts.map((p) => p.value)
  const mn = values.length ? Math.min(...values) : 0
  const mx = values.length ? Math.max(...values) : 0
  const sp = mx - mn || 1

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pts.length < 2) return
    const r = e.currentTarget.getBoundingClientRect()
    const xf = ((e.clientX - r.left) / r.width) * 760
    const n = pts.length
    const i = Math.max(0, Math.min(n - 1, Math.round((Math.max(10, Math.min(710, xf)) - 10) / 700 * (n - 1))))
    const v = values[i]
    const svgH = (r.width * 230) / 760
    const xPx = ((10 + (i / (n - 1)) * 700) / 760) * r.width
    const yPx = ((220 - ((v - mn) / sp) * 210) / 230) * svgH
    setTip({ x: xPx, y: yPx, v, d: dateLabel(pts[i].t) })
  }

  const ranges = RANGES.map((r) => {
    const on = r.k === range
    return {
      ...r,
      bg: on ? (ui.dark ? '#F2EDE3' : '#1B1710') : 'transparent',
      fg: on ? (ui.dark ? '#15120D' : '#F2EDE3') : (ui.dark ? '#B5AC99' : '#4C4638'),
      bc: on ? (ui.dark ? '#F2EDE3' : '#1B1710') : (ui.dark ? 'rgba(242,237,227,.28)' : 'rgba(27,23,16,.28)'),
    }
  })

  const xticks = pts.length >= 2 ? [0, Math.floor((pts.length - 1) / 3), Math.floor((2 * (pts.length - 1)) / 3), pts.length - 1].map((i) => dateLabel(pts[i].t)) : []

  return (
    <div style={{ position: 'relative', background: 'var(--t-panel)', border: '1px solid var(--t-hair2)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ font: `600 10px ${mono}`, letterSpacing: '.2em', color: 'var(--t-gold)' }}>INDEX — {range}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {ranges.map((r) => (
            <button key={r.k} className="range-pill" onClick={() => setRange(r.k)} style={{ background: r.bg, border: `1px solid ${r.bc}`, borderRadius: 8, color: r.fg, font: `600 9.5px ${mono}`, letterSpacing: '.12em', padding: '7px 12px' }}>{r.k}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <>
          <div className="shimmer" style={{ height: 230, borderRadius: 8 }} />
          <div className="shimmer" style={{ marginTop: 10, height: 12, width: 220, borderRadius: 6 }} />
        </>
      ) : isOk(a.indexSeries) && pts.length >= 2 ? (
        <>
          <div onMouseMove={onMove} onMouseLeave={() => setTip(null)} style={{ position: 'relative', cursor: 'crosshair' }}>
            <svg viewBox="0 0 760 230" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <linearGradient id="gfillL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--t-liveFill)" />
                  <stop offset="1" stopColor="transparent" />
                </linearGradient>
              </defs>
              <line x1="10" x2="710" y1="18" y2="18" style={{ stroke: 'var(--t-line)' }} strokeWidth={1} />
              <line x1="10" x2="710" y1="115" y2="115" style={{ stroke: 'var(--t-line)' }} strokeWidth={1} />
              <line x1="10" x2="710" y1="212" y2="212" style={{ stroke: 'var(--t-line)' }} strokeWidth={1} />
              <path d={areaPath(values, 720, 230, 10)} fill="url(#gfillL)" style={{ animation: 'fadeIn .9s ease .5s backwards' }} />
              <path className="chart-line" d={linePath(values, 720, 230, 10)} fill="none" strokeWidth={6} pathLength={1} style={{ stroke: 'var(--t-liveGlow)' }} />
              <path className="chart-line" d={linePath(values, 720, 230, 10)} fill="none" strokeWidth={1.8} pathLength={1} style={{ stroke: 'var(--t-live)' }} />
            </svg>
            <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '6%' }}>
              <span style={{ position: 'absolute', top: '7.8%', left: 2, transform: 'translateY(-50%)', font: `500 9px ${mono}`, color: 'var(--t-ink3)', whiteSpace: 'nowrap' }}>{fmtNum(mx)}</span>
              <span style={{ position: 'absolute', top: '50%', left: 2, transform: 'translateY(-50%)', font: `500 9px ${mono}`, color: 'var(--t-ink3)', whiteSpace: 'nowrap' }}>{fmtNum((mn + mx) / 2)}</span>
              <span style={{ position: 'absolute', top: '92.2%', left: 2, transform: 'translateY(-50%)', font: `500 9px ${mono}`, color: 'var(--t-ink3)', whiteSpace: 'nowrap' }}>{fmtNum(mn)}</span>
            </div>
            {tip && (
              <>
                <div style={{ position: 'absolute', top: 0, left: tip.x, width: 1, height: '100%', background: 'var(--t-cross)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: tip.x, top: tip.y, width: 9, height: 9, margin: '-4.5px 0 0 -4.5px', transform: 'rotate(45deg)', background: 'var(--t-live)', border: '1.5px solid var(--t-bg)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: Math.max(6, tip.x + 14), top: Math.max(4, tip.y - 54), background: 'var(--t-ttbg)', color: 'var(--t-ttink)', borderRadius: 6, padding: '6px 10px', boxShadow: '0 4px 14px rgba(0,0,0,.35)', pointerEvents: 'none' }}>
                  <div style={{ font: `600 12.5px ${mono}` }}>{fmtNum(tip.v)}</div>
                  <div style={{ font: `500 9px ${mono}`, letterSpacing: '.1em', color: 'var(--t-ttmut)', marginTop: 3 }}>{tip.d} · INDEX</div>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px 0', maxWidth: '93%' }}>
            {xticks.map((t, i) => (
              <span key={i} style={{ font: `500 9px ${mono}`, letterSpacing: '.1em', color: 'var(--t-ink3)' }}>{t}</span>
            ))}
          </div>
        </>
      ) : (
        <div style={{ height: 242, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 11, border: '1px dashed var(--t-goldDash)', borderRadius: 10, background: 'repeating-linear-gradient(135deg,var(--t-stripe) 0 8px,transparent 8px 16px)', padding: 20, textAlign: 'center' }}>
          <div style={{ width: 10, height: 10, transform: 'rotate(45deg)', border: '1px solid var(--t-gold)' }} />
          <div style={{ font: '600 16.5px var(--f-display)', color: 'var(--t-ink)' }}>Insufficient data to publish this index</div>
          <div style={{ font: `600 9.5px ${mono}`, letterSpacing: '.16em', color: 'var(--t-gold)' }}>{a.verifiedSales90d} OF {a.salesThreshold} VERIFIED SALES · TRAILING 90D</div>
          <div style={{ font: '400 12.5px var(--f-display)', color: 'var(--t-ink2)', lineHeight: 1.6, maxWidth: 400 }}>Tessera withholds index values rather than estimate from thin data. The index publishes automatically once the verified-sales threshold is met.</div>
        </div>
      )}

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, font: `500 9px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink3)' }}>
        <span style={{ width: 4, height: 4, background: 'var(--t-live)', borderRadius: '50%' }} />SRC {a.sourceLabel} · VERIFIED SALES ONLY
      </div>
    </div>
  )
}

export type { RangeKey }
