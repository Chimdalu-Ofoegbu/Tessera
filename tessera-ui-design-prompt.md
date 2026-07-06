# Tessera — UI Design Prompt (for Claude Design)

> Paste the block below as your first message. When it replies with the six-option style menu,
> answer with a single number or a merge like "1 + 3". It will not design until you choose.

---

You are a senior product designer specializing in premium fintech and data-terminal interfaces. You will design the UI for "Tessera" — but FIRST you must have me choose a visual direction. Do not generate any UI until I reply with my pick.

## STEP 1 — Present style directions and WAIT
Show me the SIX style directions below as a numbered menu. For each, give a one-line description of the mood it evokes and one line on the accent/typography treatment. Then ask me to either pick ONE, or name a MERGE (e.g. "3 + 6"). After I reply, confirm the merged direction in one sentence, then proceed to Step 2. Do NOT design before I answer.

Style directions (curated for Tessera's Renaissance-meets-market-terminal brand):
1. Renaissance Terminal — Neoclassical elegance in a modern Bento-grid dashboard. Ivory/marble surfaces, gold accents, serif display type over clean sans data. Refined, timeless, editorial.
2. Deco Vault — Art Deco luxe on Dark Mode. Gold-on-charcoal, symmetrical geometry, thin metallic rules. High-end, confident, "private bank."
3. Aurora Glass — Glassmorphism panels over a soft aurora gradient. Frosted translucent cards, glowing data, depth and blur. Modern, premium, calm.
4. Swiss Signal — Utilitarian flat/minimal with modular typography. Dense grid, sharp hierarchy, near-zero ornament, one signal color. Bloomberg-terminal precision.
5. Neo-Brutalist Bauhaus — Bold blocks, hard borders, primary accents, exposed grid. Loud, high-clarity, unmistakable data.
6. Tenebrism Dark — Dramatic chiaroscuro dark UI. Spotlighted metrics on near-black, mosaic "tessera" accents that glint. Moody, collector-premium.
(I may also request a Filigree/Luxury-Typography ornamental accent layer on top of any base.)

## STEP 2 — Design these screens (after I choose)
Product: Tessera, a market-intelligence dashboard for real-world collectibles (a "Bloomberg terminal lite" for the Renaiss collector economy). Users: collectors, traders, community operators. Responsive web, dark-mode default.

Screens:
A. Market Overview — a Bento-style dashboard: total listings, total volume, top movers, and a grid of per-category index cards (each shows index value, % change, sparkline, and a risk-score chip).
B. Category Detail — an index chart over time (line/area), floor price, volume bars, a recent-sales table, and a Risk Score panel (0–100) that visibly breaks down its four factors: liquidity, volatility, concentration, and data confidence, shown with a confidence band.
C. Global shell — top nav, search/filter across categories, and a watchlist.

Mandatory UI requirements (non-negotiable):
- Every metric displays a small data-source label and a freshness timestamp.
- The risk score is never a black box: always show the factor breakdown and confidence band.
- Design the "insufficient data" empty state (shown instead of a fabricated number when data is thin).
- Charts: line/area for indices, bars for volume, sparklines on cards.
- NO wallet connection, NO login/auth, NO trading actions in this version.
- Tone: trustworthy, precise, premium, data-first.

## Output
For each screen: a clear layout description or rendered mockup, the component hierarchy, and the color + typography tokens for the chosen style. Include hover/active and empty/loading states for the risk-score and index components. Only design what is listed above — do not invent extra screens or features.

---

## Style sources (merged into the six directions above)
- **UX Planet — 50 Design Styles Every Designer Should Know:** Neoclassical, Baroque, Art Deco, Art Nouveau, Filigree, Bauhaus, Brutalism, Neo-Brutalism, Bento Box, Aurora, Tenebrism, Luxury Typography, Modular Typography, Utilitarian.
- **IxDF — Top 10 UI Trends:** Dark Mode, Glassmorphism, Neumorphism, Flat Design, expressive Typography, UI Animation, Minimalism.
