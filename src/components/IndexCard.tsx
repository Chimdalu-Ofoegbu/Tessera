import { isOk, linePath, fmtNum, pct, arrow, changeColor, srcLine, riskView } from '@/lib/view'
import type { UI } from '@/ui'
import type { CategoryCard } from '@/lib/compute'

function RiskChip({ card, dark }: { card: CategoryCard; dark: boolean }) {
  if (!isOk(card.risk)) {
    return (
      <span style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.12em', color: 'var(--t-ink3)', border: '1px dashed var(--t-dash)', borderRadius: 7, padding: '5px 9px' }}>NOT SCORED</span>
    )
  }
  const rv = riskView(card.risk.value, dark)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 9.5px var(--f-mono)', letterSpacing: '.12em', color: rv.tier.color, border: `1px solid ${rv.tier.border}`, borderRadius: 7, padding: '5px 9px' }}>
      <span style={{ width: 6, height: 6, transform: 'rotate(45deg)', background: rv.tier.color }} />
      RISK {rv.score} · {rv.tier.tier}
    </span>
  )
}

export function IndexCard({ ui, card }: { ui: UI; card: CategoryCard }) {
  const dark = ui.dark
  const watched = ui.isWatched(card.id)
  const starColor = watched ? (dark ? '#C9A961' : '#8A6D1F') : '#8B8271'
  const chg = card.change24h
  const chgCol = changeColor(chg, dark)
  const src = srcLine(card.sourceLabel, card.updatedAt)

  return (
    <div className="idx-card rise" onClick={() => ui.openCat(card.id)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: '22px 24px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '600 9px var(--f-mono)', letterSpacing: '.2em', color: 'var(--t-gold)' }}>{card.code}</div>
          <div style={{ font: '700 15.5px var(--f-display)', color: 'var(--t-ink)', marginTop: 6, lineHeight: 1.25 }}>{card.label}</div>
        </div>
        <button className="star-btn" onClick={(e) => ui.toggleWatch(card.id, e)} title="Toggle watchlist" style={{ fontSize: 14, lineHeight: 1, margin: '-2px -4px 0 0', color: starColor }}>
          {watched ? '◆' : '◇'}
        </button>
      </div>

      {isOk(card.index) ? (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 22 }}>
            <div>
              <div style={{ font: '500 30px var(--f-mono)', color: 'var(--t-ink)', letterSpacing: '-.02em', lineHeight: 1 }}>{fmtNum(card.index.value)}</div>
              <div style={{ font: '600 11px var(--f-mono)', color: chgCol, marginTop: 7 }}>
                {arrow(chg)} {chg != null ? pct(chg) : ''} <span style={{ color: 'var(--t-ink3)', fontWeight: 500 }}>24H</span>
              </div>
            </div>
            <svg viewBox="0 0 120 34" style={{ width: 118, height: 34, flex: 'none', display: 'block', overflow: 'visible', marginBottom: 2 }}>
              <path className="spark-path" d={linePath(card.sparkline.map((p) => p.usdCents), 118, 32, 2)} pathLength={1} fill="none" stroke={chgCol} strokeWidth={1.5} />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 11, marginTop: 20, paddingTop: 15, borderTop: '1px solid var(--t-line)' }}>
            <RiskChip card={card} dark={dark} />
            <span style={{ font: '500 9.5px var(--f-mono)', letterSpacing: '.08em', color: 'var(--t-ink3)', whiteSpace: 'nowrap' }}>{src}</span>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginTop: 22, border: '1px dashed var(--t-goldDash)', borderRadius: 10, padding: '14px 15px', background: 'repeating-linear-gradient(135deg,var(--t-stripe) 0 7px,transparent 7px 14px)' }}>
            <div style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.16em', color: 'var(--t-gold)' }}>INSUFFICIENT DATA</div>
            <div style={{ font: '400 12px var(--f-display)', color: 'var(--t-ink2)', marginTop: 6, lineHeight: 1.5 }}>
              {card.verifiedSales90d} of {card.salesThreshold} verified sales in trailing 90d — index withheld rather than estimated.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 11, marginTop: 20, paddingTop: 15, borderTop: '1px solid var(--t-line)' }}>
            <span style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.12em', color: 'var(--t-ink3)', border: '1px dashed var(--t-dash)', borderRadius: 7, padding: '5px 9px' }}>NOT SCORED</span>
            <span style={{ font: '500 9.5px var(--f-mono)', letterSpacing: '.08em', color: 'var(--t-ink3)', whiteSpace: 'nowrap' }}>{src}</span>
          </div>
        </>
      )}
    </div>
  )
}
