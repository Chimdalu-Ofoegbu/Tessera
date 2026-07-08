import { useOverview } from '@/api/hooks'
import { isOk, money, fmtInt, pct, arrow, changeColor, timeUTC } from '@/lib/view'
import type { UI } from '@/ui'
import { IndexCard } from './IndexCard'

const mono = 'var(--f-mono)'

export function Overview({ ui }: { ui: UI }) {
  const { data, isLoading, isError } = useOverview()
  const q = ui.q.trim().toLowerCase()

  const wrap = (children: React.ReactNode) => (
    <div data-tt-theme={ui.theme} style={{ background: 'var(--t-bg)', minHeight: 'calc(100vh - 60px)' }}>
      <div className="rise" style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px 80px' }}>
        <div style={{ marginBottom: 10 }}>
          <button className="btn-secondary" onClick={ui.goHome} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: `600 10.5px ${mono}`, letterSpacing: '.14em', padding: '9px 17px' }}>
            <span style={{ fontSize: 14, lineHeight: 1, marginTop: -1 }}>‹</span>HOME
          </button>
        </div>
        {children}
      </div>
    </div>
  )

  if (isLoading || !data) return wrap(<div style={{ font: `500 11px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink3)', padding: '40px 0' }}>LOADING MARKET DATA…</div>)
  if (isError) return wrap(<div style={{ font: `500 11px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink3)', padding: '40px 0' }}>DATA UNAVAILABLE — RETRYING…</div>)

  const cats = data.categories
  const thin = cats.filter((c) => !isOk(c.index)).length
  const scored = cats.filter((c) => isOk(c.index) && c.change24h != null)
  const avg24 = scored.length ? scored.reduce((a, c) => a + (c.change24h ?? 0), 0) / scored.length : 0
  const movers = data.topMovers.slice(0, 3)
  const upd = timeUTC(data.asOf)
  const filtered = cats.filter((c) => !q || c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))

  const sectionHeader = (title: string, right?: React.ReactNode, mt = 0, id?: string) => (
    <div id={id} style={{ borderTop: '1px solid var(--t-rule)', paddingTop: 14, marginTop: mt, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <span style={{ font: '800 19px var(--f-display)', fontStretch: '115%', letterSpacing: '.06em', color: 'var(--t-ink)' }}>{title}</span>
      {right}
    </div>
  )
  const srcDot = (label: string) => (
    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, font: `500 9px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink3)' }}>
      <span style={{ width: 4, height: 4, background: 'var(--t-live)', borderRadius: '50%' }} />
      {label}
    </div>
  )

  return wrap(
    <>
      {sectionHeader('MARKET OVERVIEW')}

      <div style={{ marginTop: 18, border: '1px solid var(--t-hair2)', borderRadius: 14, overflow: 'hidden', background: 'var(--t-panel)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))' }}>
        <div style={{ position: 'relative', background: 'radial-gradient(130% 100% at 25% 0%,var(--t-radA),var(--t-radB) 55%),var(--t-panel)', padding: '24px 26px', boxShadow: '0 0 0 .5px var(--t-seam)' }}>
          <div style={{ font: `600 10px ${mono}`, letterSpacing: '.2em', color: 'var(--t-ink2)' }}>TOTAL VOLUME — TRAILING 30D</div>
          <div style={{ font: `500 46px ${mono}`, letterSpacing: '-.04em', color: 'var(--t-ink)', lineHeight: 1, marginTop: 16 }}>{money(data.totalVolume.cents)}</div>
          <div style={{ font: `500 11.5px ${mono}`, color: changeColor(avg24, ui.dark), marginTop: 9 }}>{arrow(avg24)} {pct(avg24)} AVG INDEX · 24H</div>
          {srcDot(`SRC RENAISS INDEX · UPD ${upd}`)}
        </div>
        <div style={{ background: 'var(--t-panel)', padding: '24px 26px', boxShadow: '0 0 0 .5px var(--t-seam)' }}>
          <div style={{ font: `600 10px ${mono}`, letterSpacing: '.2em', color: 'var(--t-ink2)' }}>ACTIVE LISTINGS</div>
          <div style={{ font: `500 38px ${mono}`, letterSpacing: '-.04em', color: 'var(--t-ink)', lineHeight: 1.1, marginTop: 18 }}>{fmtInt(data.totalListings)}</div>
          <div style={{ font: `500 11px ${mono}`, color: 'var(--t-ink3)', marginTop: 9 }}>{cats.length} CATEGORIES · 6 VENUES</div>
          {srcDot(`SRC AUCTION FEED · UPD ${upd}`)}
        </div>
        <div style={{ background: 'var(--t-panel)', padding: '20px 22px', boxShadow: '0 0 0 .5px var(--t-seam)' }}>
          <div style={{ font: `600 10px ${mono}`, letterSpacing: '.2em', color: 'var(--t-ink2)', marginBottom: 12 }}>TOP MOVERS — 24H</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {movers.map((m) => (
              <div key={m.id} className="mover-row" onClick={() => ui.openCat(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 8px', margin: '0 -8px', borderTop: '1px solid var(--t-line)' }}>
                <span style={{ font: `600 10px ${mono}`, letterSpacing: '.1em', color: 'var(--t-gold)', width: 34 }}>{m.code}</span>
                <span style={{ flex: 1, font: '500 12.5px var(--f-display)', color: 'var(--t-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</span>
                <span style={{ font: `600 11.5px ${mono}`, color: changeColor(m.change24h, ui.dark) }}>{arrow(m.change24h)} {m.change24h != null ? pct(m.change24h) : ''}</span>
              </div>
            ))}
          </div>
          {srcDot(`SRC RENAISS INDEX · UPD ${upd}`)}
        </div>
      </div>

      {sectionHeader('CATEGORY INDICES', <div style={{ font: `500 9.5px ${mono}`, letterSpacing: '.13em', color: 'var(--t-ink3)' }}>{cats.length} TRACKED · {thin} BELOW DATA THRESHOLD</div>, 64, 'cat-indices')}

      {filtered.length === 0 ? (
        <div style={{ marginTop: 16, border: '1px dashed var(--t-goldDash)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ font: '600 15px var(--f-display)', color: 'var(--t-ink2)' }}>No categories match “{ui.q}”</div>
          <button className="btn-secondary" onClick={() => ui.setQ('')} style={{ marginTop: 14, borderRadius: 9, font: '600 12.5px var(--f-display)', padding: '9px 16px' }}>Clear search</button>
        </div>
      ) : (
        <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 22 }}>
          {filtered.map((c) => (
            <IndexCard key={c.id} ui={ui} card={c} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderTop: '1px solid var(--t-line)', paddingTop: 14 }}>
        <div style={{ font: `500 9.5px ${mono}`, letterSpacing: '.12em', color: 'var(--t-ink3)' }}>INDICES ARE VOLUME-WEIGHTED, REBASED TO 100 · NO ESTIMATES PUBLISHED BELOW THRESHOLD</div>
        <div style={{ font: `500 9.5px ${mono}`, letterSpacing: '.12em', color: 'var(--t-ink3)' }}>TESSERA MARKET INTELLIGENCE · READ-ONLY TERMINAL</div>
      </div>
    </>,
  )
}
