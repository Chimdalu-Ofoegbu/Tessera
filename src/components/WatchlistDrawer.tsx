import { useOverview } from '@/api/hooks'
import { isOk, fmtNum, pct, arrow, changeColor } from '@/lib/view'
import type { UI } from '@/ui'

const mono = 'var(--f-mono)'

export function WatchlistDrawer({ ui }: { ui: UI }) {
  const { data } = useOverview()
  const items = (data?.categories ?? []).filter((c) => ui.watch.includes(c.id))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div onClick={ui.toggleDrawer} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 344, background: '#1A1610', borderLeft: '1px solid rgba(242,237,227,.18)', padding: '24px 22px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ font: '800 14px var(--f-display)', fontStretch: '115%', letterSpacing: '.22em', color: '#F2EDE3' }}>WATCHLIST</div>
          <button className="btn-ghost" onClick={ui.toggleDrawer} style={{ background: '#241E15', borderColor: 'rgba(242,237,227,.25)', color: '#B5AC99', font: `500 10px ${mono}`, padding: '6px 9px' }}>ESC</button>
        </div>
        <div style={{ font: `500 9.5px ${mono}`, letterSpacing: '.14em', color: '#8B8271', marginBottom: 18 }}>{ui.watch.length} PINNED · LOCAL ONLY</div>

        {items.length === 0 ? (
          <div style={{ border: '1px dashed rgba(201,169,97,.5)', borderRadius: 10, padding: '22px 18px', textAlign: 'center' }}>
            <div style={{ width: 9, height: 9, transform: 'rotate(45deg)', border: '1px solid #C9A961', margin: '0 auto 12px' }} />
            <div style={{ font: '500 12.5px var(--f-display)', color: '#B5AC99', lineHeight: 1.5 }}>Nothing pinned yet. Tap ◇ on any category card to track it here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((c) => (
              <div key={c.id} className="drawer-row" onClick={() => ui.openCat(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#241E15', border: '1px solid rgba(242,237,227,.12)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: `600 10px ${mono}`, letterSpacing: '.14em', color: '#C9A961' }}>{c.code}</div>
                  <div style={{ font: '600 13px var(--f-display)', color: '#F2EDE3', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ font: `500 13px ${mono}`, color: '#F2EDE3' }}>{isOk(c.index) ? fmtNum(c.index.value) : '—'}</div>
                  <div style={{ font: `500 10.5px ${mono}`, color: changeColor(c.change24h, true) }}>{arrow(c.change24h)} {c.change24h != null ? pct(c.change24h) : ''}</div>
                </div>
                <button className="star-btn" onClick={(e) => ui.toggleWatch(c.id, e)} title="Remove" style={{ color: '#C9A961', fontSize: 13 }}>◆</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
