import { useMemo, useState } from 'react'
import { useCategory } from '@/api/hooks'
import { isOk, money, fmtNum, fmtInt, pct, arrow, changeColor, srcLine, timeUTC, centsToMoney } from '@/lib/view'
import type { UI } from '@/ui'
import { IndexChart, type RangeKey } from './IndexChart'
import { RiskPanel } from './RiskPanel'
import type { CategoryAnalytics } from '@/lib/compute'

const mono = 'var(--f-mono)'
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const saleDate = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MON[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`
}

function StatCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: 'var(--t-panel)', padding: '16px 18px', boxShadow: '0 0 0 .5px var(--t-seam)' }}>
      <div style={{ font: `600 9.5px ${mono}`, letterSpacing: '.18em', color: 'var(--t-ink2)' }}>{label}</div>
      <div style={{ font: `500 27px ${mono}`, letterSpacing: '-.02em', color: 'var(--t-ink)', marginTop: 10 }}>{value}</div>
      <div style={{ marginTop: 10, font: `500 9.5px ${mono}`, letterSpacing: '.08em', color: 'var(--t-ink3)' }}>{sub}</div>
    </div>
  )
}

function VolumeBars({ a }: { a: CategoryAnalytics }) {
  const bars = useMemo(() => {
    if (!isOk(a.indexSeries)) return []
    const vals = a.indexSeries.value.points.filter((p) => p.value !== null).map((p) => p.value as number)
    const diffs: number[] = []
    for (let i = 1; i < vals.length; i++) diffs.push(Math.abs(vals[i] - vals[i - 1]))
    const src = diffs.length ? diffs.slice(-24) : [1]
    const mx = Math.max(...src) || 1
    return src.map((d) => 20 + Math.round((d / mx) * 80))
  }, [a.indexSeries])
  const upd = timeUTC(a.updatedAt)

  return (
    <div style={{ background: 'var(--t-panel)', border: '1px solid var(--t-hair)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ font: `600 10px ${mono}`, letterSpacing: '.2em', color: 'var(--t-gold)' }}>TRADING ACTIVITY — INDEX MOVEMENT</div>
        <div style={{ font: `500 9px ${mono}`, letterSpacing: '.1em', color: 'var(--t-ink3)' }}>LAST SESSIONS</div>
      </div>
      {isOk(a.indexSeries) ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 96 }}>
          {bars.map((h, i) => (
            <div key={i} className="bar" style={{ flex: 1, height: `${h}%`, minHeight: 2, background: 'linear-gradient(180deg,var(--t-barA),var(--t-barB))', borderRadius: '3px 3px 0 0', transformOrigin: 'bottom', animation: `barRise .7s cubic-bezier(.3,.7,.3,1) backwards`, animationDelay: `${(i * 0.03).toFixed(2)}s` }} />
          ))}
        </div>
      ) : (
        <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--t-dash)', borderRadius: 10, font: `500 10px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink3)', textAlign: 'center', padding: '0 16px' }}>VOLUME REPORTING SUSPENDED — COVERAGE BELOW THRESHOLD</div>
      )}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, font: `500 9px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink3)' }}>
        <span style={{ width: 4, height: 4, background: 'var(--t-live)', borderRadius: '50%' }} />SRC {a.sourceLabel} · UPD {upd}
      </div>
    </div>
  )
}

function RecentSales({ a }: { a: CategoryAnalytics }) {
  const upd = timeUTC(a.updatedAt)
  const floorCents = isOk(a.floor) ? a.floor.value.cents : 0
  const nearest = (cents: number): string => {
    let best = a.constituents[0]
    let bestD = Infinity
    for (const c of a.constituents) {
      const cc = isOk(c.price) ? c.price.value.cents : Infinity
      const dd = Math.abs(cc - cents)
      if (dd < bestD) { bestD = dd; best = c }
    }
    return best ? best.name : a.label
  }
  const cols = 'minmax(220px,1fr) 90px 100px 90px 150px'

  return (
    <div style={{ marginTop: 14, background: 'var(--t-panel)', border: '1px solid var(--t-hair)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ font: `600 10px ${mono}`, letterSpacing: '.2em', color: 'var(--t-gold)' }}>RECENT SALES</div>
        <div style={{ font: `500 9px ${mono}`, letterSpacing: '.1em', color: 'var(--t-ink3)' }}>VERIFIED · LAST 30D</div>
      </div>
      {isOk(a.risk) ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, padding: '10px 8px', borderBottom: '1px solid var(--t-headRule)', font: `600 9px ${mono}`, letterSpacing: '.16em', color: 'var(--t-ink3)' }}>
            <span>LOT</span><span>SOLD</span><span style={{ textAlign: 'right' }}>PRICE</span><span style={{ textAlign: 'right' }}>VS FLOOR</span><span style={{ textAlign: 'right' }}>VENUE</span>
          </div>
          {a.recentSales.map((s, i) => (
            <div key={i} className="row-hover" style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, padding: '11px 8px', borderBottom: '1px solid var(--t-line)' }}>
              <span style={{ font: '400 12.5px var(--f-display)', color: 'var(--t-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nearest(s.price.cents)} · {s.gradeLabel ?? 'RAW'}</span>
              <span style={{ font: `500 11px ${mono}`, color: 'var(--t-ink3)' }}>{saleDate(s.observedAt)}</span>
              <span style={{ font: `500 12px ${mono}`, color: 'var(--t-ink)', textAlign: 'right' }}>{money(s.price.cents)}</span>
              <span style={{ font: `500 11px ${mono}`, color: 'var(--t-gold)', textAlign: 'right' }}>{floorCents ? '×' + (s.price.cents / floorCents).toFixed(1) : '—'}</span>
              <span style={{ font: `500 11px ${mono}`, color: 'var(--t-ink3)', textAlign: 'right' }}>{s.source}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, font: `500 9px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink3)' }}>
            <span style={{ width: 4, height: 4, background: 'var(--t-live)', borderRadius: '50%' }} />SRC {a.sourceLabel} · UPD {upd} · UNVERIFIED SALES EXCLUDED
          </div>
        </>
      ) : (
        <div style={{ marginTop: 8, border: '1px dashed var(--t-goldDash)', borderRadius: 10, padding: 22, textAlign: 'center' }}>
          <div style={{ font: '600 14px var(--f-display)', color: 'var(--t-ink2)' }}>{a.verifiedSales90d} verified sales on record — {a.salesThreshold - a.verifiedSales90d} more to publish</div>
          <div style={{ maxWidth: 360, margin: '14px auto 0', height: 5, background: 'var(--t-track)', borderRadius: 3 }}>
            <div style={{ height: 5, width: `${Math.round((a.verifiedSales90d / a.salesThreshold) * 100)}%`, background: 'linear-gradient(90deg,#8F6F26,#C9A961)', borderRadius: 3 }} />
          </div>
          <div style={{ marginTop: 8, font: `500 9px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink3)' }}>THRESHOLD {a.salesThreshold} VERIFIED SALES · TRAILING 90D · SRC {a.sourceLabel} · UPD {upd}</div>
        </div>
      )}
    </div>
  )
}

export function Detail({ ui, catId }: { ui: UI; catId: string }) {
  const { data: a, isLoading } = useCategory(catId)
  const [range, setRange] = useState<RangeKey>('90D')
  const [rangeLoading, setRangeLoading] = useState(false)
  const changeRange = (k: RangeKey) => {
    setRange(k)
    setRangeLoading(true)
    setTimeout(() => setRangeLoading(false), 350)
  }

  const wrap = (children: React.ReactNode) => (
    <div data-tt-theme={ui.theme} style={{ background: 'var(--t-bg)', minHeight: 'calc(100vh - 60px)' }}>
      <div className="rise" style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px 80px' }}>{children}</div>
    </div>
  )

  if (isLoading || !a) return wrap(<div style={{ font: `500 11px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink3)', padding: '40px 0' }}>LOADING CATEGORY…</div>)

  const watched = ui.isWatched(a.id)
  const upd = timeUTC(a.updatedAt)
  const src = srcLine(a.sourceLabel, a.updatedAt)
  const loading = rangeLoading

  return wrap(
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, font: `500 10px ${mono}`, letterSpacing: '.16em', color: 'var(--t-ink3)' }}>
        <button className="star-btn" onClick={ui.goOverview} style={{ color: 'var(--t-gold)', font: `600 10px ${mono}`, letterSpacing: '.16em', padding: '6px 2px' }}>‹ MARKETS</button>
        <span>/</span><span style={{ color: 'var(--t-ink2)' }}>{a.code}</span>
      </div>

      <div style={{ borderTop: '1px solid var(--t-rule)', paddingTop: 14, marginTop: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ font: '800 25px var(--f-display)', fontStretch: '115%', letterSpacing: '.02em', color: 'var(--t-ink)', lineHeight: 1.1, textTransform: 'uppercase' }}>{a.label}</div>
          <button onClick={(e) => ui.toggleWatch(a.id, e)} style={{ background: 'var(--t-panel)', border: '1px solid var(--t-goldDash)', borderRadius: 8, color: 'var(--t-gold)', font: `600 9.5px ${mono}`, letterSpacing: '.14em', padding: '8px 12px', cursor: 'pointer' }}>{watched ? '◆ WATCHING' : '◇ WATCH'}</button>
        </div>
      </div>

      <div style={{ marginTop: 18, border: '1px solid var(--t-hair2)', borderRadius: 14, overflow: 'hidden', background: 'var(--t-panel)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <div style={{ background: 'var(--t-panel)', padding: '16px 18px', boxShadow: '0 0 0 .5px var(--t-seam)' }}>
          <div style={{ font: `600 9.5px ${mono}`, letterSpacing: '.18em', color: 'var(--t-ink2)' }}>INDEX VALUE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
            <span style={{ font: `500 27px ${mono}`, letterSpacing: '-.02em', color: 'var(--t-ink)' }}>{isOk(a.index) ? fmtNum(a.index.value) : '—'}</span>
            <span style={{ font: `600 12px ${mono}`, color: changeColor(a.change24h, ui.dark) }}>{arrow(a.change24h)} {a.change24h != null ? pct(a.change24h) : ''}</span>
          </div>
          <div style={{ marginTop: 10, font: `500 9.5px ${mono}`, letterSpacing: '.08em', color: 'var(--t-ink3)' }}>{src}</div>
        </div>
        <StatCell label="FLOOR PRICE" value={centsToMoney(a.floor)} sub={`LOWEST VERIFIED ASK · ${src}`} />
        <StatCell label="VOLUME — 30D" value={money(a.volume.cents)} sub={`SRC AUCTION FEED · UPD ${upd}`} />
        <StatCell label="ACTIVE LISTINGS" value={fmtInt(a.listings)} sub={`SRC AUCTION FEED · UPD ${upd}`} />
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'stretch', marginTop: 14 }}>
        <div style={{ flex: '1.7 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <IndexChart ui={ui} a={a} loading={loading} range={range} setRange={changeRange} />
          <VolumeBars a={a} />
        </div>
        <RiskPanel ui={ui} a={a} loading={loading} />
      </div>

      <RecentSales a={a} />
    </>,
  )
}
