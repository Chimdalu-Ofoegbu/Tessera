# Tessera — Demo Script & Submission Checklist

**Live:** https://tessera-terminal.vercel.app
**One-liner:** *Renaiss gives you the price; Tessera adds the risk lens.* A "Bloomberg-terminal lite" for graded trading cards — per-category indices with a transparent, confidence-banded risk score, a source + timestamp on every number, and honest "insufficient data" states.

## 60–90s walkthrough

1. **Landing hero (~10s).** Open the live URL. The 8 category cards float in 3D (drag one to spin it). Read the line: *"risk scores that show their work — and a source on every number."* Note the live counters ($ volume · listings · 8 indices). Click **Enter Terminal**.
2. **Market overview (~20s).** Point out the bento: total volume, active listings, **top movers**. Then the 8 index cards — each with a sparkline, a **RISK chip + tier**, and a `SRC … · UPD …` line. Call out that risk **varies** (PKM low / NBA · OPR moderate) — it's not cosmetic.
3. **Category detail — the risk lens (~30s).** Click **Basketball · Rookie Cards (NBA)**. Show the index chart (hover for the crosshair tooltip). Then the **Risk Score panel**: the 48-pt score + tier, the **confidence band**, and the **four factors** with definitions. Land the story: *"Basketball scores MODERATE despite being liquid — because **concentration** is high: one card, the '86 Jordan, is ~87% of the category value. The score shows exactly why."*
4. **The safety design (~20s).** Breadcrumb back, open **Lorcana · First Chapter**. Everything renders **"INSUFFICIENT DATA / NOT SCORED"** — index withheld, risk withheld, volume suspended, sales progress bar. Say: *"11 of 25 verified sales — Tessera withholds rather than estimate. The safe state is a feature, not an error."*
5. **Trust close (~10s).** Toggle dark/light. Note every metric carries its source + freshness. Mention the **public JSON API** (`/api/overview.json`) and that it's the real Renaiss card domain behind a swappable `DataSource` (`USE_RENAISS=1`).

## Pre-demo verification sweep (SHIP-02) — app-side ✓ verified

- [x] Every visible number shows a **source + freshness** line.
- [x] Risk **reconciles** (4 factors → headline) and is **deterministic + versioned** (`risk@1.1.0`); 48 unit tests.
- [x] Index reads **100 at base**, reproducible by hand; explicit gaps, never interpolated.
- [x] **Thin category renders insufficient live** (Lorcana) across card, chart, volume, risk, sales.
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
- Prod serves a **pre-generated static `/api/*.json` snapshot** (CDN-reliable). To regenerate after a data change: `pnpm dev`, then re-run the snapshot curls into `public/api/`, or run the serverless handlers in `api/*.ts` locally.
- Optional live Renaiss data: set `USE_RENAISS=1` (+ `RENAISS_API_KEY`/`RENAISS_API_SECRET`) — one wiring point; public tier is 10 req/day so the cached snapshot is the demo-safe default.
