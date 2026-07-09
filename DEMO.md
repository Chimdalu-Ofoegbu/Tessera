# Tessera — Demo Script & Submission Checklist

**Live:** https://www.tesseraindex.xyz (custom domain; `tesseraindex.xyz` and https://tessera-terminal.vercel.app also serve) — **running on live Renaiss Index data** (every metric `source: "renaiss"`).
**One-liner:** *Renaiss gives you the price; Tessera adds the risk lens.* A "Bloomberg-terminal lite" for graded trading cards — real Renaiss indices with a transparent, confidence-banded risk score, a source + timestamp on every number, and honest "insufficient data" states.

## 60–90s walkthrough (numbers = live snapshot of 2026-07-07; re-check before recording)

1. **Landing hero (~10s).** Open the live URL. The live category cards float in 3D (drag one to spin it). Read the line: *"risk scores that show their work — and a source on every number."* Counters are real Renaiss figures (floor value · listings · indices). Click **Enter Terminal**.
2. **Market overview (~15s).** The bento: **total floor value**, active listings, **top movers — 7D** (both indices are red this week: PKM −2.15%, OPC −3.22% — real market, not a happy-path demo). Each index card: sparkline, **RISK chip + tier**, `SRC RENAISS INDEX · UPD …`.
3. **Category detail — the risk lens (~30s).** Open **Pokémon**. The chart is **Tessera's reproducible index, rebased to 100** — currently ~81, a real drawdown over the window, with every point published (30/30). Then the **Risk panel**: score **8 · LOW**, confidence band, and the four factors reconciling to the headline. Now flip to **One Piece**: **11 · LOW**, and point at WHY — **volatility 29.0 vs Pokémon's 18.0** (liquidity identical at 0). *"Same liquidity, same confidence — One Piece scores riskier purely on realized volatility. The score shows its work."*
4. **The safety design (~15s).** On the detail page, the Recent Sales card reads **"No per-sale records disclosed by the source for this window · NOTHING WITHHELD BY TESSERA"** — Renaiss doesn't expose per-sale rows on the public tier, and Tessera says so instead of inventing rows. Same principle end-to-end: any thin/stale/short-series tile renders **INSUFFICIENT / NOT SCORED** automatically (engine-tested), never an estimate.
5. **Trust close (~10s).** Open `/api/overview.json`: **every metric wrapped in provenance — `"source": "renaiss"`, `asOf`, `confidence`, `sampleSize`**. The risk factor contributions sum to the headline score; the engine is versioned (`risk@1.1.0`). Live data, no black box.

## Pre-demo verification sweep (SHIP-02) — app-side ✓ verified

- [x] Every visible number shows a **source + freshness** line — and it's real: `SRC RENAISS INDEX`, `source: "renaiss"` in every API payload.
- [x] Risk **reconciles** (4 factors → headline) and is **deterministic + versioned** (`risk@1.1.0`); 49 unit tests.
- [x] Index reads **100 at base**, reproducible by hand; explicit gaps, never interpolated.
- [x] **Withhold-don't-estimate is live**: undisclosed per-sale records render an explicit "nothing withheld by Tessera" note; thin/stale/short-series tiles auto-render INSUFFICIENT (engine-gated + unit-tested — currently both live categories are healthy).
- [x] Honest labels audited against the live source: display deltas are **7D** (what Renaiss publishes), the value KPI is **floor value — listings** (its actual derivation), no invented venue counts or feeds.
- [x] Redundant cues (tier text + arrows, not color-only); honest chart axes.
- [x] **Deep-links survive refresh** (SPA rewrite) — verified 200 on the live URL.
- [x] No wallet / login / trading; nothing labeled a "verified valuation".

## Your remaining submission steps

- [ ] **Record** the 60–90s clip against the live URL (not localhost).
- [ ] **Push to a public GitHub repo** and confirm it's public. From the project root:
  ```bash
  gh repo create tessera-terminal --public --source . --push   # (or create on github.com and: git remote add origin <url> && git push -u origin main)
  ```
  Commits are clean (authored by you; no AI co-author trailers).
- [ ] Submit: live link + repo + clip.

**Notes**
- Prod serves a **pre-generated static `/api/*.json` snapshot of the LIVE Renaiss Index API** (CDN-reliable; the public tier's 10 req/day cap rules out per-request proxying). To refresh before recording: `USE_RENAISS=1 pnpm dev --port 5199`, curl `/api/overview.json`, `/api/categories.json`, `/api/health.json`, and per-id `categories/{id}.json` + `index/{id}.json` into `public/api/` (≈5 upstream calls), rebuild, redeploy. New Renaiss games appear automatically.
- Local dev/tests default to seed fixtures (`MockSource`) — that's where the deliberately-thin Lorcana safety demo lives on demand; partner creds (`RENAISS_API_KEY`/`RENAISS_API_SECRET`) enable higher-frequency refresh.
