import type { Screen, UI } from '@/ui'

function Logo({ ui, home }: { ui: UI; home: boolean }) {
  const second = home ? '#2E8065' : 'var(--t-live)'
  const fourth = home ? '#1B1710' : 'var(--t-ink)'
  const ink = home ? '#1B1710' : 'var(--t-ink)'
  return (
    <div onClick={ui.goHome} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 'none' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '7px 7px', gap: 2, transform: 'rotate(45deg)' }}>
        <div style={{ width: 7, height: 7, background: '#C9A961' }} />
        <div style={{ width: 7, height: 7, background: second }} />
        <div style={{ width: 7, height: 7, background: '#8F6F26' }} />
        <div style={{ width: 7, height: 7, background: fourth }} />
      </div>
      <div style={{ font: '800 13px var(--f-display)', fontStretch: '120%', letterSpacing: '.3em', marginRight: '-.3em', color: ink }}>TESSERA</div>
    </div>
  )
}

function SearchGroup({ ui, home }: { ui: UI; home: boolean }) {
  const gold = home ? '#8A6D1F' : 'var(--t-gold)'
  const goldB = home ? 'rgba(138,109,31,.55)' : 'var(--t-goldB)'
  const panel = home ? '#FAF7F0' : 'var(--t-panel)'
  const hair = home ? 'rgba(27,23,16,.22)' : 'var(--t-hair2)'
  const ink = home ? '#1B1710' : 'var(--t-ink)'
  return (
    <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        onClick={ui.goOverview}
        style={{ font: "600 10.5px var(--f-mono)", letterSpacing: '.18em', color: gold, borderBottom: `1px solid ${goldB}`, padding: '4px 1px', cursor: 'pointer', flex: 'none' }}
      >
        MARKETS
      </div>
      <input
        className="search-input"
        value={ui.q}
        onChange={(e) => ui.setQ(e.target.value)}
        placeholder="Search categories — name or code"
        style={{ width: 340, maxWidth: '42vw', background: panel, border: `1px solid ${hair}`, borderRadius: 9, color: ink, font: '400 11.5px var(--f-mono)', letterSpacing: '.04em', padding: '9px 12px' }}
      />
    </div>
  )
}

export function Nav({ ui, screen }: { ui: UI; screen: Screen }) {
  const home = screen === 'home'
  const wrap: React.CSSProperties = home
    ? { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(242,237,227,.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(27,23,16,.16)' }
    : { position: 'sticky', top: 0, zIndex: 50, background: 'var(--t-navbg)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--t-hair)' }
  return (
    <div {...(!home ? { 'data-tt-theme': ui.theme } : {})} style={wrap}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 24, height: 60, maxWidth: 1440, margin: '0 auto', padding: '0 32px' }}>
        <Logo ui={ui} home={home} />
        <SearchGroup ui={ui} home={home} />
        {!home && (
          <>
            <button
              className="btn-ghost"
              onClick={ui.toggleTheme}
              title="Toggle dark / light theme"
              style={{ flex: 'none', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, font: '600 9.5px var(--f-mono)', letterSpacing: '.14em', padding: '8px 13px' }}
            >
              <span style={{ fontSize: 12, lineHeight: 1 }}>{ui.dark ? '☀' : '☾'}</span>
              {ui.dark ? 'LIGHT' : 'DARK'}
            </button>
            <button
              className="btn-watch"
              onClick={ui.toggleDrawer}
              style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, font: '600 13px var(--f-display)', padding: '9px 16px' }}
            >
              Watchlist <span style={{ font: '600 11px var(--f-mono)', background: 'rgba(242,237,227,.2)', borderRadius: 5, padding: '1px 6px' }}>{ui.watch.length}</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
