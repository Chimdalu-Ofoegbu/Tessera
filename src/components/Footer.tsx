import type { UI } from '@/ui'

const mono = 'var(--f-mono)'

function Tile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="tile-hover" onClick={onClick} style={{ flex: '1 1 220px', minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(242,237,227,.35)', borderRadius: 14, font: '600 22px var(--f-display)', color: '#F2EDE3' }}>
      {label}
    </div>
  )
}

export function Footer({ ui }: { ui: UI }) {
  return (
    <div style={{ background: '#15120D' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '88px 32px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ font: '800 clamp(28px,3.8vw,54px)/1.08 var(--f-display)', fontStretch: '115%', letterSpacing: '-.02em', color: '#F2EDE3', textTransform: 'uppercase' }}>Made for serious collectors.</div>
          <button className="tile-hover" onClick={() => window.scrollTo({ top: 0, behavior: ui.motion ? 'smooth' : 'auto' })} title="Back to top" style={{ flex: 'none', width: 56, height: 56, background: 'transparent', border: '1px solid rgba(242,237,227,.4)', borderRadius: 10, color: '#F2EDE3', fontSize: 20, cursor: 'pointer' }}>↑</button>
        </div>

        <div style={{ display: 'flex', gap: 18, alignItems: 'stretch', marginTop: 88, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 280px', minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 70px', gap: 9, transform: 'rotate(45deg)' }}>
              <div style={{ width: 70, height: 70, background: '#C9A961', borderRadius: 8 }} />
              <div style={{ width: 70, height: 70, background: '#2E8065', borderRadius: 8 }} />
              <div style={{ width: 70, height: 70, background: '#8F6F26', borderRadius: 8 }} />
              <div style={{ width: 70, height: 70, background: '#F2EDE3', borderRadius: 8 }} />
            </div>
          </div>
          <Tile label="Market overview" onClick={ui.goOverview} />
          <Tile label="Category indices" onClick={ui.goOverview} />
          <Tile label="Watchlist" onClick={() => { ui.goOverview(); setTimeout(ui.toggleDrawer, 40) }} />
        </div>

        <div style={{ marginTop: 22, border: '1px solid rgba(242,237,227,.35)', borderRadius: 12, padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ font: `500 10.5px ${mono}`, letterSpacing: '.12em', color: '#B5AC99' }}>© TESSERA 2026 · READ-ONLY TERMINAL</span>
            <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>
              <span style={{ width: 6, height: 6, transform: 'rotate(45deg)', background: '#C9A961' }} />
              <span style={{ width: 6, height: 6, transform: 'rotate(45deg)', border: '1px solid rgba(143,111,38,.8)' }} />
              <span style={{ width: 6, height: 6, transform: 'rotate(45deg)', background: '#2E8065' }} />
            </span>
          </div>
          <div style={{ display: 'flex', gap: 26 }}>
            <span className="link-muted" style={{ font: `500 10.5px ${mono}`, letterSpacing: '.12em', color: '#B5AC99' }}>DATA: RENAISS INDEX API</span>
            <span className="link-muted" style={{ font: `500 10.5px ${mono}`, letterSpacing: '.12em', color: '#B5AC99' }}>METHODOLOGY</span>
          </div>
        </div>
      </div>
    </div>
  )
}
