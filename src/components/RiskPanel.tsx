import { isOk, riskView, timeUTC } from '@/lib/view'
import type { UI } from '@/ui'
import type { CategoryAnalytics } from '@/lib/compute'

const mono = 'var(--f-mono)'
const Shim = ({ h, w, mt }: { h: number; w?: number | string; mt: number }) => (
  <div className="shimmer" style={{ height: h, width: w ?? '100%', borderRadius: 8, marginTop: mt }} />
)
const confFromTier = (c: 'high' | 'medium' | 'low'): number => (c === 'high' ? 85 : c === 'medium' ? 55 : 22)

export function RiskPanel({ ui, a, loading }: { ui: UI; a: CategoryAnalytics; loading: boolean }) {
  const upd = timeUTC(a.updatedAt)
  const meter = (w: number) => (
    <div style={{ marginTop: 5, height: 4, background: 'var(--t-track)', borderRadius: 3 }}>
      <div style={{ height: 4, width: `${w}%`, background: 'linear-gradient(90deg,#8F6F26,#C9A961)', borderRadius: 3 }} />
    </div>
  )

  return (
    <div style={{ flex: '1 1 330px', minWidth: 0 }}>
      <div style={{ position: 'relative', background: 'radial-gradient(120% 80% at 50% 0%,var(--t-radA),var(--t-radB) 60%),var(--t-panel)', border: '1px solid var(--t-hair2)', borderRadius: 14, padding: '22px 24px', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ font: `600 10px ${mono}`, letterSpacing: '.2em', color: 'var(--t-gold)' }}>RISK SCORE</div>
          <div style={{ font: `500 9px ${mono}`, letterSpacing: '.1em', color: 'var(--t-ink3)' }}>0–100 · LOWER IS SAFER</div>
        </div>

        {loading ? (
          <>
            <Shim h={56} w={150} mt={18} />
            <Shim h={8} mt={16} />
            <Shim h={120} mt={26} />
          </>
        ) : isOk(a.risk) ? (
          (() => {
            const rv = riskView(a.risk.value, ui.dark)
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 14 }}>
                  <div style={{ font: `500 48px ${mono}`, letterSpacing: '-.04em', lineHeight: 1, color: rv.tier.color }}>{rv.score}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `600 9.5px ${mono}`, letterSpacing: '.14em', color: rv.tier.color, border: `1px solid ${rv.tier.border}`, borderRadius: 7, padding: '4px 9px' }}>
                    <span style={{ width: 6, height: 6, transform: 'rotate(45deg)', background: rv.tier.color }} />
                    {rv.tier.tier}
                  </span>
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ position: 'relative', height: 7, background: 'var(--t-track)', borderRadius: 3 }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${rv.bandLo}%`, width: `${rv.bandHi - rv.bandLo}%`, background: 'var(--t-band)', borderRadius: 3 }} />
                    <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${rv.score}%`, width: 2, background: rv.tier.color }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, font: `500 9.5px ${mono}`, color: 'var(--t-ink3)' }}>
                    <span>0</span><span>50</span><span>100</span>
                  </div>
                  <div style={{ marginTop: 8, font: `500 10px ${mono}`, letterSpacing: '.1em', color: 'var(--t-ink2)' }}>CONFIDENCE BAND {rv.bandLo}–{rv.bandHi} · DATA CONFIDENCE {rv.conf}/100</div>
                  <div style={{ marginTop: 4, font: '400 11.5px var(--f-display)', color: 'var(--t-exp)', lineHeight: 1.5 }}>The band widens as data confidence falls. Same score, wider band → treat with more caution.</div>
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--t-line)', display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {rv.factors.map((f) => (
                    <div key={f.k}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ font: `600 9.5px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink)' }}>{f.k}</span>
                        <span style={{ font: `500 11px ${mono}`, color: 'var(--t-ink)' }}>{f.v}<span style={{ color: 'var(--t-ink3)' }}>/100</span></span>
                      </div>
                      {meter(f.v)}
                      <div style={{ marginTop: 4, font: '400 11px var(--f-display)', color: 'var(--t-exp)', lineHeight: 1.45 }}>{f.def}</div>
                    </div>
                  ))}
                </div>
              </>
            )
          })()
        ) : (
          <>
            <div style={{ marginTop: 16, border: '1px dashed var(--t-dash)', borderRadius: 10, padding: '18px 16px', textAlign: 'center' }}>
              <div style={{ font: `500 28px ${mono}`, color: 'var(--t-ink3)' }}>—</div>
              <div style={{ font: `600 9.5px ${mono}`, letterSpacing: '.16em', color: 'var(--t-ink3)', marginTop: 4 }}>NOT SCORED</div>
              <div style={{ font: '400 11.5px var(--f-display)', color: 'var(--t-ink2)', lineHeight: 1.55, marginTop: 10 }}>
                Scoring requires more verified coverage. Publishing a score from {a.verifiedSales90d} sales would be a guess, not a measurement.
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: `600 9.5px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink)' }}>DATA CONFIDENCE</span>
                <span style={{ font: `500 11px ${mono}`, color: 'var(--t-ink)' }}>{confFromTier(a.risk.provenance.confidence)}<span style={{ color: 'var(--t-ink3)' }}>/100</span></span>
              </div>
              {meter(confFromTier(a.risk.provenance.confidence))}
              <div style={{ marginTop: 4, font: '400 11px var(--f-display)', color: 'var(--t-exp)', lineHeight: 1.45 }}>Verified coverage of source records. The other factors publish once coverage improves.</div>
            </div>
            <div style={{ marginTop: 14, font: `500 9.5px ${mono}`, letterSpacing: '.1em', color: 'var(--t-ink3)', lineHeight: 1.7 }}>LIQUIDITY · VOLATILITY · CONCENTRATION<br />WITHHELD UNTIL COVERAGE IMPROVES</div>
          </>
        )}

        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 6, font: `500 9px ${mono}`, letterSpacing: '.14em', color: 'var(--t-ink3)' }}>
          <span style={{ width: 4, height: 4, background: 'var(--t-live)', borderRadius: '50%' }} />SRC TESSERA RISK ENGINE · {isOk(a.risk) ? a.risk.value.version : 'risk@1.1.0'} · UPD {upd}
        </div>
      </div>
    </div>
  )
}
