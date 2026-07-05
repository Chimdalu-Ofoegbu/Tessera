# Pitfalls Research

**Domain:** Market-intelligence dashboard with derived per-category price indices + explainable risk scoring, on labeled mock/seed data (one-week hackathon build)
**Researched:** 2026-07-05
**Confidence:** HIGH (index-construction, thin-liquidity, chart-deception, explainability, and adapter-seam findings verified against BLS/IMF methodology, NFT wash-trading research, XAI literature, and pattern docs; hackathon-scoping findings MEDIUM)

> Framing: Tessera is judged on Usability, Innovation, Ecosystem relevance, Clarity, and **Safety**. The most dangerous pitfalls here are not crashes — they are pitfalls that quietly **make the product untrustworthy** (fabricated numbers, black-box scores, missing provenance, misleading charts). A polished dashboard that lies at a glance scores worse on the actual rubric than a plainer one that is honest. Every critical pitfall below maps to a judged criterion.

---

## Critical Pitfalls

### Pitfall 1: Fabricating numbers on thin data instead of rendering "insufficient data"

**What goes wrong:**
A category has 2 sales this week, or a chart has 3 data points, and the UI happily renders a floor, a 7-day index change, and a risk score as if they were solid. The index line interpolates confidently across gaps; the risk score reads "72 — Moderate" off almost nothing. This is the single highest-stakes failure: it is a **stated safety rule**, an **explicit Active requirement**, and the demo's proof-of-safety beat all at once. If a judge finds one fabricated-looking number, the entire "trust the numbers" value proposition collapses.

**Why it happens:**
The happy path is easy and the thin-data path is extra work, so under time pressure teams build only the former. Seed data is usually generated dense and clean, so the thin-data branch is never exercised and silently rots. Aggregations (`avg`, `last`, `pct_change`) return a plausible-looking number for n=1 or n=2 without complaint — nothing forces the code to notice the sample is too thin.

**How to avoid:**
- Make "insufficient data" a **first-class return value of the data/metric layer**, not a UI afterthought. Every metric function returns either `{ value, confidence, sampleSize, sources, asOf }` or `{ status: "insufficient", reason, sampleSize }`. The UI cannot render a number the layer refused to compute.
- Define explicit thresholds up front and version them alongside the risk methodology (e.g. floor requires >= N active listings; an index point requires >= M sales in the window; a risk factor is `null` if its inputs are below threshold). Encode the thresholds as named constants, not magic numbers scattered in components.
- **Seed at least one category deliberately thin** so the state is always demoable and always exercised. This is required for the demo beat anyway — build it as real data, not a hardcoded screen.
- Render the state as a clear, deliberate UI treatment (labeled panel, greyed metric, "Insufficient data — N sales in period") — never a blank, a `NaN`, a `0`, or a `—` that reads like a real value.

**Warning signs:**
- Any metric renders for a category with a visibly tiny sample and no caveat.
- `NaN`, `Infinity`, `undefined`, `0.0%`, or `—` appearing where a value should be — these are fabrication's tells.
- The "insufficient data" component exists in code but no seed category ever triggers it (dead safety feature = no safety feature).
- Index charts draw a smooth line across a multi-day gap with no visual break or annotation.

**Phase to address:**
Data/metric layer phase (define the contract + thresholds), then reinforced in the risk-engine phase (factors degrade to `null`) and the dashboard phase (render the state). Must be exercised end-to-end before the demo phase — this is a demo beat.

---

### Pitfall 2: Opaque or non-reproducible risk methodology (black-box or "verified valuation")

**What goes wrong:**
The risk score appears as a bare number ("Risk: 68") with no visible factor breakdown, or the breakdown exists but the numbers don't add up to the headline, or the score changes between two runs on identical data (non-deterministic). Worse: the copy implies the score is a **verified valuation or guarantee** ("fair value: 68", "safe to buy") rather than a scored, confidence-banded *signal*. Any of these directly violates the "no black box" Active requirement, the "never a verified valuation" Out-of-Scope rule, and torpedoes the Clarity and Safety scores — the two criteria this project is explicitly built to win.

**Why it happens:**
Reaching for an ML model or an opaque weighted blob feels "smarter" and is tempting for the Innovation criterion, but it is exactly wrong here — the innovation is the *transparent, explainable* risk-scored index, not the sophistication of the model. Non-determinism sneaks in through `Date.now()`, `Math.random()`, unstable sort orders, floating-point accumulation order, or live-timestamp inputs baked into the score. "Valuation" language creeps in because it sounds more authoritative and confident than "signal."

**How to avoid:**
- Build the risk engine as a **pure, deterministic, versioned function**: same inputs -> same output, every time. No wall-clock, no randomness, no network inside the scoring path. Stamp every score with a `methodologyVersion` (e.g. `risk-v1`) so a shown score is always reproducible and auditable.
- Compute the score as an **explicit, additive (or clearly weighted) sum of named factors** where the factors visibly reconcile to the headline. If the UI shows liquidity −15, volatility −10, momentum +5, the arithmetic must land on the number shown. Follow the XAI norm: show *which signals drove the score and by how much* (a SHAP-style contribution list), not just a total.
- Attach a **confidence band** to every score, driven by data sufficiency (thin inputs -> wide band / lower confidence). The band is not decoration — it is the mechanism that keeps the score a "signal, not a guarantee."
- **Audit all copy** for guarantee/valuation language. Ban "fair value," "verified," "safe," "guaranteed," "true price." Use "risk signal," "scored estimate," "confidence band," "based on N sales." Add a persistent one-line disclaimer near the score.
- Write the factor formulas into a short, checked-in `METHODOLOGY.md` (or an in-app "How this score works" panel) so the method is legible to a judge without a code read.

**Warning signs:**
- Two runs on identical seed data produce different scores, or scores drift as the clock advances.
- The displayed factor contributions don't sum to the headline number.
- The score has no visible confidence band, or the band never changes across categories with very different data density.
- Any UI/marketing string reads as a valuation, recommendation, or guarantee.
- You cannot explain, in one sentence per factor, why a given category scored what it did.

**Phase to address:**
Risk-engine phase owns determinism, versioning, factor reconciliation, and confidence bands. Dashboard/detail phase owns the factor-breakdown UI and the copy audit. Both must land before the demo — the "expand the risk score to show factors + source" beat depends on it.

---

### Pitfall 3: Missing or weak provenance (source label + freshness timestamp)

**What goes wrong:**
Numbers appear on screen with no source attribution and no "as of" timestamp — or the timestamp is the page-load time (fake freshness) rather than the data's actual recency. On mock data especially, it's tempting to skip this because "it's just seed data." But provenance is a **judged Clarity/Safety element and a core Active requirement** ("Every metric labeled with its data source and freshness timestamp"), and it's the cheapest possible trust signal to earn — or lose.

**Why it happens:**
Provenance is metadata that's easy to defer ("I'll add labels later") and easy to forget on the mock path, since seed data has no natural "source." Timestamp bugs arise from rendering `new Date()` at display time instead of carrying the data's own `asOf` field through the pipeline. When many small metrics render, per-metric attribution feels repetitive and gets dropped for the aggregate ones.

**How to avoid:**
- Make `source` and `asOf` **required fields on the metric contract** (same envelope as Pitfall 1). A metric without provenance is a type error, not a rendering choice. This is also what forces the mock-to-real seam to stay honest (see Pitfall 6): mock records carry an explicit source like `"Renaiss mock/seed v1"`.
- Carry the data's own timestamp end-to-end; never synthesize freshness at render time. Show relative + absolute ("updated 2h ago · 2026-07-05 14:30 UTC") and, for seed data, label it unmistakably as mock/seed so no judge mistakes it for live.
- Provide a shared provenance component (badge/tooltip) reused everywhere a metric appears, so attribution is consistent and can't be forgotten per-metric.
- Distinguish *data freshness* (when the underlying data is from) from *computed-at* (when the index/score was calculated) if they differ — conflating them misleads.

**Warning signs:**
- Any number on screen without a visible or hover-accessible source + timestamp.
- Timestamps that update on refresh even though the data didn't change (page-load time leaking in).
- Aggregate/overview metrics lack provenance even though category metrics have it.
- Mock data is not visibly labeled as mock, risking a judge assuming it's live.

**Phase to address:**
Data/metric layer phase (provenance as required fields) and dashboard phase (shared provenance component, correct timestamp rendering). Verified in a pre-demo "every visible number has a source + date" sweep.

---

### Pitfall 4: Index construction errors (normalization, base period, volume weighting, wash trading)

**What goes wrong:**
The per-category index looks authoritative but is built wrong, so it misleads with a straight face:
- **Base-period mistakes:** base isn't actually pinned to 100 at the chosen reference period; different categories use different base periods so their lines aren't comparable; or re-seeding silently shifts the base and the whole series jumps.
- **Normalization mistakes:** mixing economically dissimilar items into one category (the floor/index breaks down when grouping mixes dissimilar items), or normalizing so that a large-magnitude category visually dominates a small one on a shared axis.
- **Volume-weighting mistakes:** unweighted average lets a single outlier or one thin sale swing the index; or weighting by raw volume lets **wash trading** dominate the index (a 10% wash-volume bump is associated with a ~1% contemporaneous return, then a reversal — pure noise the index would absorb as signal).
- **Gap handling:** interpolating or carrying-forward across no-trade periods manufactures a smooth trend that didn't happen.

**Why it happens:**
Index construction reads as "just average the prices," but real methodology (BLS/IMF) distinguishes price-reference, weight-reference, and index-reference periods and handles rebasing via explicit linking — subtleties that are easy to skip under deadline. Volume weighting is added for realism without considering that mock (or real) volume can be dominated by a few trades. Charting libraries auto-fit axes and auto-smooth lines, so misleading defaults appear without anyone choosing them.

**How to avoid:**
- **Pin the base explicitly:** choose one base period, set index = 100 there for every category, and make it impossible for re-seeding to shift it (base value stored/derived deterministically, not recomputed from mutable "latest" data). If you rebase, link the series rather than silently recomputing.
- **Keep categories comparable:** all categories share the same base period and the same construction so their index *levels* are legitimately comparable; document what belongs in each category so grouping stays economically coherent.
- **Volume-weight with guardrails:** use volume weighting (per the Key Decision) but cap or winsorize outlier trades, and require a minimum sample per index point (ties into Pitfall 1). Consider excluding or flagging suspected wash-trade patterns in seed data so the index demonstrates robustness — a strong Innovation/Ecosystem talking point.
- **Never fabricate continuity:** represent no-trade gaps honestly (break the line, dot the segment, or annotate) instead of interpolating a trend.
- **Sanity-check the numbers:** hand-verify one category's index math against the raw seed rows so you can defend it live.

**Warning signs:**
- Index doesn't equal 100 at the base period, or two categories have different base periods.
- Re-seeding changes historical index values that should be fixed.
- A single trade visibly moves the index level.
- The index line is perfectly smooth across a period you know had no sales.
- You can't reproduce a plotted index point by hand from the underlying rows.

**Phase to address:**
Index-computation phase (part of or adjacent to the metric layer) owns base-period pinning, weighting, and gap handling. Dashboard/chart phase owns honest axis + gap rendering (overlaps Pitfall 7). Sanity-check belongs in the pre-demo verification pass.

---

### Pitfall 5: Misleading chart rendering (truncated/dual axes, deceptive scaling)

**What goes wrong:**
Even with a correctly-constructed index, the *chart* lies. Charting libraries default to fitting the y-axis to the data range, which **truncates the axis** and exaggerates small moves into dramatic swings — the most common visualization pitfall. A dual-axis chart (e.g. index level vs. volume, or index vs. risk) implies a correlation that isn't there. Inconsistent color meaning across views, or missing axis labels/units, leaves the reader guessing. For a product whose entire pitch is "trustworthy at a glance," a deceptive chart is self-sabotage against Usability, Clarity, and Safety simultaneously.

**Why it happens:**
Auto-fit axes and auto-smoothing are library defaults nobody consciously chose; they just look "zoomed in and dynamic." Dual axes are reached for to pack more onto one chart. Under time pressure, axis labels, units, and consistent color scales are the first polish to get cut.

**How to avoid:**
- **Choose axis baselines deliberately.** For an index normalized to 100, anchor the y-axis at a fixed, honest reference (e.g. include 100; use a stable range) rather than auto-fitting to whatever the data happens to span. If you must zoom to show small variation, label it clearly and prefer a change/return view over a magnitude view — never let a truncated axis do the lying.
- **Avoid dual y-axes for different units.** Prefer two aligned charts (small multiples) over one dual-axis chart that implies false correlation. If a second series shares the index's unit/scale, one axis is fine.
- **Label everything:** axis titles, units, base period ("Index, base 2026-06-01 = 100"), and legends. Never rely on color alone to distinguish series (ties into Pitfall 8) — use labels/markers/line styles too.
- **Keep color meaning consistent** across the whole dashboard (a color means the same thing everywhere) and reserve red/green for genuinely up/down, with a redundant cue.

**Warning signs:**
- Small index moves look dramatic; the y-axis doesn't start where a reader would expect and isn't labeled as zoomed.
- Two different-unit series share one chart with two axes.
- A chart has no axis labels, units, or base-period annotation.
- The same color means different things on different views.

**Phase to address:**
Dashboard/chart phase. Verified in the pre-demo readability/honesty review.

---

### Pitfall 6: Mock-data layer that can't cleanly swap to a real Renaiss source (leaky abstraction)

**What goes wrong:**
Because real Renaiss data access is an unresolved CTO question, v1 runs on mock/seed data behind a "normalized data layer" — and the whole point is that a real source can drop in later without reworking the UI or risk engine. That promise breaks when the abstraction **leaks**: mock-specific shapes, field names, ID formats, or synchronous/in-memory assumptions bleed into the UI and risk engine. Then "swap the source" becomes "rewrite the app," the clean-seam Key Decision is falsified, and a plausible judge/CTO question ("how do you go live?") has a bad answer.

**Why it happens:**
Interfaces written *after* the mock implementation inherit the mock's quirks (a classic leaky-abstraction cause). It's tempting to let components read the raw seed JSON directly ("it's right there"), coupling the UI to the mock's exact shape. Error/empty/loading behavior of a real async API (latency, failures, pagination) is rarely modeled by a synchronous in-memory mock, so a whole side-channel of behavior is unabstracted — exactly where leaks hide.

**How to avoid:**
- **Design the domain data contract first, then make the mock implement it** — not the reverse. Define the `MarketDataSource` interface (categories, floors, volume, sales history, each returning the metric envelope with `source`/`asOf`/`confidence`/`sampleSize`) in the app's own terms, and translate mock records into it inside the adapter. This is the anti-corruption-layer discipline: adapter translates the external/mock shape into the domain shape; nothing downstream sees the raw source.
- **Nothing outside the adapter imports the seed files or knows the source is mock.** UI and risk engine depend only on the interface. Grep for direct seed imports outside the data layer as a guard.
- **Model async and failure now.** Make the interface `async` and have the mock exercise loading/empty/error paths (and thin-data / insufficient states), so switching to a networked source doesn't surface a class of behavior the UI never handled.
- Keep the seam narrow and one-directional: no mock exception types, file paths, or synthetic IDs escaping into domain code.

**Warning signs:**
- A UI component or risk function imports the seed JSON directly, or references a mock-only field name.
- The data interface was written after the mock and mirrors its shape exactly.
- Everything is synchronous and there's no loading/error handling — a real API will break assumptions.
- Swapping in a stub "real" source would require touching components, not just the adapter.

**Phase to address:**
Data-layer/architecture phase (define the contract, build the adapter, enforce the boundary). This phase should be early — it constrains every downstream phase — and verified with a "could a second source implement this interface without UI changes?" review.

---

### Pitfall 7: Over-scoping the one-week window (demo fragility, wasted time)

**What goes wrong:**
The classic hackathon failure: teams accomplish ~25% of what they plan. Time goes into deferred "Should Have" items (search, watchlist, alerts), a real backend, polish on the wrong things, or a fourth chart — while the **core demo path** (overview -> category index -> expand risk factors + source -> insufficient-data state) stays fragile or unfinished. Come demo day the live link errors, the recorded clip is missing, or the one flow judges actually watch is the least-tested one. Build window is Jul 4–11 with buffer reserved for bugs and submission, so every misallocated day is expensive.

**Why it happens:**
Optimism about velocity, plus the pull of shiny deferred features and "real infra" over the unglamorous core. Mock/seed data can create false confidence — everything passes locally because the data is perfect, while the real demo (a human clicking a hosted link) is never rehearsed. Submission mechanics (hosting, recording, repo visibility) are left to the last hour, exactly when they fail (private repo, broken video link, demo site 500s).

**How to avoid:**
- **Protect the golden path.** Treat the 60–90s demo flow as the definition of done for v1; get it working end-to-end early, then harden it. Everything in "Should Have" is strictly pull-in-if-time and cut without hesitation. Respect the Out-of-Scope list (no wallet/auth/mobile-native) as a hard fence, not a suggestion.
- **Build the demo's hardest beats first**, not last: the risk-factor breakdown and the insufficient-data state are the differentiators and the safety proof — if they slip, the whole submission weakens. Do them before search/watchlist/alerts.
- **Rehearse the real demo, not just localhost.** Record the walkthrough early against the deployed link; a rough recorded clip in hand beats a perfect local build that no one can see. Re-verify repo is public, link loads, and video plays as a pre-submission checklist item.
- **Reserve explicit buffer** (per the timeline constraint) for bug-fixing and submission; don't spend it on features.

**Warning signs:**
- Deferred features are being built while a core beat (index, risk breakdown, or insufficient-data) is still stubbed.
- No end-to-end run has been done against the *deployed* URL by mid-week.
- Submission artifacts (hosted link, recording, public repo) don't exist yet as the deadline nears.
- "It works on my machine" is the only evidence the demo works.

**Phase to address:**
Cross-cutting; owned by roadmap sequencing (core beats before deferred features) and an explicit demo/hardening/submission phase at the end. Scope discipline is a planning concern, so PROJECT.md's Active/Should-Have/Out-of-Scope split should drive phase ordering directly.

---

### Pitfall 8: Readability / accessibility failures that undermine "usable at a glance"

**What goes wrong:**
The core value is that a judge or collector understands the market *at a glance* and trusts it. That fails if the dashboard is a dense wall of numbers, if meaning is carried by **color alone** (red/green up-down with no other cue — invisible to red-green colorblind viewers, ~8% of men), if contrast is too low to read on a projector, or if too much is crammed in so nothing reads. Since Usability and Clarity are two of five judged criteria — and the demo is a short live walkthrough likely on a shared screen — poor readability directly costs points and can sink the "at a glance" pitch in real time.

**Why it happens:**
Data-dense dashboards tempt maximal information density. Red/green is the default financial palette and gets used as the *only* signal. Contrast and label polish are late-stage work that gets cut. Demos are often viewed on projectors/compressed video where subtle color and low contrast disappear — a condition never tested during desk development.

**How to avoid:**
- **Never encode meaning by color alone** (WCAG 1.4.1). Pair every color cue with a redundant one: arrows/▲▼, +/− signs, direct labels, line styles, or icons. Use a colorblind-safe palette (blue/green ranges test well) and reserve red/green for direction with a second cue.
- **Meet contrast minimums** (4.5:1 body text, 3:1 large text) and test on a projector-like setting, not just a crisp laptop screen.
- **Design the glance first.** Establish a clear visual hierarchy — overview headline metrics big and scannable, detail on drill-in — rather than showing everything at once. Fewer, well-labeled numbers beat a dense grid for the "at a glance" claim.
- Label units and metrics inline (see Pitfall 5) so nothing requires prior explanation — the value proposition is "without explanation."

**Warning signs:**
- Up/down or risk level is shown only via red/green with no shape, sign, or label.
- Text/values fail a contrast check or vanish on a projector/compressed recording.
- The overview shows so many numbers that no hierarchy is discernible in a 2-second glance.
- A first-time viewer needs a verbal explanation to read the dashboard.

**Phase to address:**
Dashboard/UI phase (hierarchy, palette, contrast, redundant cues). Verified with a "glance test" (can a fresh person read it in a few seconds, on a projector-like screen?) before the demo.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Components read seed JSON directly instead of via the data adapter | Fewer layers, faster first render | Falsifies the clean-seam decision; real-source swap becomes a rewrite (Pitfall 6) | **Never** — this is the whole architectural bet |
| "Insufficient data" handled only in the UI, not in the metric layer | One less abstraction to build | Fabricated numbers slip through anywhere the layer is reused; safety rule not actually enforced (Pitfall 1) | **Never** — it's a stated safety rule |
| Risk score as a single weighted number, factor breakdown "added later" | Ship a score fast | Reads as a black box; violates Active requirement + Clarity/Safety (Pitfall 2) | Only in a throwaway spike, never in anything shown |
| Timestamp = render time instead of data's `asOf` | No plumbing needed | Fake freshness misleads; provenance requirement failed (Pitfall 3) | **Never** — trivially wrong and trust-destroying |
| Mock data made dense and perfect only | Everything looks great locally | Thin-data + async + error paths never exercised; false demo confidence (Pitfalls 1, 6, 7) | Only if a deliberately thin + a failing case are also seeded |
| Auto-fit chart axes, ship library defaults | Zero chart config | Truncated-axis deception; undermines trust pitch (Pitfall 5) | Only after consciously verifying the baseline is honest |
| Building search/watchlist/alerts before the core demo path is solid | Feels like progress | Core beats stay fragile; classic over-scope (Pitfall 7) | Only once the golden path is end-to-end and hardened |

## Integration Gotchas

Common mistakes when connecting to (eventually) a real Renaiss source.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Renaiss data source (future) | Writing the data interface *after* the mock, mirroring the mock's shape | Define the domain contract first (anti-corruption layer); mock and real source both translate into it |
| Mock -> real swap | Mock is synchronous/in-memory; UI never handles latency, pagination, or failure | Make the interface `async` now; mock exercises loading/empty/error paths so real API surfaces nothing new |
| Source metadata | Provenance (`source`, `asOf`) added per-source ad hoc | Provenance is a required field on the shared metric envelope; every source must populate it |
| Historical sales for the index | Assuming a real feed returns clean, gap-free, dense history like the seed | Model gaps, thin windows, and outliers/wash trades now (Pitfalls 1, 4) so the index is robust before real data arrives |

## Performance Traps

At hackathon scale (a handful of categories, cached JSON), true performance is a non-issue; the real "performance" risk is **demo-time reliability**, not throughput.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recomputing indices/scores on every render instead of once from cached data | Sluggish UI, flicker during the live demo | Compute once (deterministically) into the cached JSON API; UI just reads | Noticeable even at small scale on a slow demo machine/projector |
| Deployed demo untested; only localhost verified | Hosted link 500s or is blank on demo day | Deploy early, rehearse against the real URL, have a recorded clip as fallback (Pitfall 7) | The moment a judge opens the link |
| Non-deterministic score recompute per session | Score differs between the recorded clip and the live run, looks buggy/untrustworthy | Pure, versioned scoring function; no clock/random in the path (Pitfall 2) | As soon as anyone runs it twice |

## Security Mistakes

Scope deliberately minimizes surface (read-only, no wallet, no auth, no private data). Remaining domain-specific concerns:

| Mistake | Risk | Prevention |
|---------|------|------------|
| Presenting the risk score as financial advice / a valuation / a guarantee | Reputational + safety-criterion failure; implies a promise the product can't make | Persistent "signal, not advice/valuation; confidence-banded" disclaimer; ban guarantee language (Pitfall 2) |
| Accidentally introducing any private/user data (e.g. a watchlist tied to identity) | Violates the "no private data" safety criterion and Out-of-Scope | Keep watchlist (if built) in-memory/local and anonymous; collect and surface nothing personal |
| Mock data not visibly labeled as mock | A judge assumes numbers are live/real -> misleads about capability and honesty | Label seed data unmistakably as mock/seed everywhere it appears (Pitfall 3) |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Meaning carried by red/green alone | ~8% of male viewers can't read up/down or risk level; fails on projectors | Redundant cue (sign/arrow/label/shape) + colorblind-safe palette (Pitfall 8) |
| Overview crammed with every metric at once | No "at a glance" comprehension; the core value fails live | Clear hierarchy: headline metrics prominent, detail on drill-in (Pitfall 8) |
| Risk score shown without its factor breakdown or confidence band | Reads as an unexplained verdict; erodes trust and Clarity | Always show factors that reconcile to the total + a confidence band (Pitfall 2) |
| Metrics without visible source/timestamp | User can't judge whether to trust a number | Provenance badge on every metric (Pitfall 3) |
| Charts with truncated/unlabeled axes | Reader misreads magnitude of moves | Honest baseline + full axis/unit/base-period labels (Pitfall 5) |
| Insufficient-data rendered as a blank/`—`/`0` | Reads as "nothing" or a real value, not "we withheld a number for safety" | Deliberate, labeled "insufficient data" treatment (Pitfall 1) |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Insufficient-data state:** Often missing an actual seed category that triggers it — verify at least one category renders it live, and that no metric ever emits `NaN`/`—`/`0` in its place.
- [ ] **Risk score:** Often missing reconciliation and determinism — verify factor contributions sum to the headline and two runs on the same data match exactly, with a version stamp visible.
- [ ] **Provenance:** Often missing on aggregate/overview metrics and shows render-time (not data) timestamps — verify *every* visible number has a source + a real `asOf`.
- [ ] **Index:** Often missing an honest base — verify index = 100 at the base period for every category and that a plotted point reproduces by hand from raw rows.
- [ ] **Charts:** Often ship with auto-fit truncated axes — verify baselines are honest, axes/units/base-period are labeled, and no dual-axis implies false correlation.
- [ ] **Data seam:** Often leaks — grep for seed-file imports outside the adapter; confirm a hypothetical second source could implement the interface with zero UI changes.
- [ ] **Accessibility:** Often color-only — verify no up/down or risk cue relies on color alone and contrast passes on a projector-like screen.
- [ ] **Submission:** Often broken at the last minute — verify public repo, working deployed link, and a playable recorded clip all exist before the deadline crunch.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Fabricated numbers on thin data (P1) | MEDIUM | Add the insufficient-data branch to the metric layer; seed a thin category; re-sweep every metric for `NaN`/`0`/`—` |
| Black-box / non-deterministic / valuation-worded score (P2) | MEDIUM–HIGH | Refactor scoring to a pure additive-factor function; strip clock/random; add factor breakdown UI + confidence band; audit and rewrite copy |
| Missing provenance (P3) | LOW | Add `source`/`asOf` to the metric envelope; render a shared provenance badge; fix render-time timestamps |
| Index construction error (P4) | MEDIUM | Re-pin base to 100; unify base period across categories; add outlier caps + min-sample per point; fix gap handling; hand-verify one category |
| Misleading chart (P5) | LOW | Set honest axis baselines; add axis/unit/base labels; split dual-axis into small multiples |
| Leaky mock seam (P6) | HIGH | Introduce the domain interface behind the adapter; move seed access inside it; refactor UI/risk to depend on the interface (costly late — do this early) |
| Over-scope / fragile demo (P7) | LOW–MEDIUM | Cut deferred features immediately; refocus on the golden path; deploy + record now |
| Color-only / low-contrast UI (P8) | LOW | Add redundant cues (sign/arrow/label); swap to colorblind-safe palette; bump contrast; re-test on projector |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls. (Phase names are indicative — the roadmap will finalize them.)

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P1 Fabricated numbers on thin data | Data/metric layer (contract + thresholds); reinforced in risk-engine & dashboard | A deliberately thin seed category renders "insufficient data" live; no `NaN`/`0`/`—` anywhere a value belongs |
| P2 Black-box / non-reproducible risk score | Risk-engine phase (determinism, versioning, factors, band); dashboard (breakdown UI + copy audit) | Same-input reruns match; factor contributions sum to headline; band present; no valuation language |
| P3 Missing provenance | Data/metric layer (required fields); dashboard (provenance component, timestamps) | Every visible number shows source + real data timestamp; mock labeled as mock |
| P4 Index construction errors | Index-computation phase (base pinning, weighting, gaps) | Index = 100 at base for all categories; a plotted point reproduces by hand; outliers/gaps handled honestly |
| P5 Misleading charts | Dashboard/chart phase | Honest axis baselines; axes/units/base-period labeled; no false-correlation dual-axis |
| P6 Leaky mock-data seam | Data-layer/architecture phase (early) | No seed imports outside the adapter; a second source could implement the interface with zero UI changes |
| P7 Over-scoping / fragile demo | Roadmap sequencing + dedicated demo/hardening/submission phase | Golden path end-to-end before deferred features; deployed-URL run + recorded clip by mid/late week; public repo + link + video verified |
| P8 Readability / accessibility | Dashboard/UI phase | No color-only cues; contrast passes on a projector; a fresh viewer reads it in seconds |

## Sources

- U.S. Bureau of Labor Statistics — CPI FAQ (price/weight/index reference periods, sampling vs non-sampling error): https://www.bls.gov/cpi/questions-and-answers.htm
- IMF — Updating CPI Weights and Linking New to Previous Series (rebasing via linking to avoid discontinuities): https://www.imf.org/-/media/Files/Data/CPI/chapter-9-updating-the-weights-and-linking-series.ashx
- Cube Exchange — Floor price and where it breaks down (thin listing depth, dissimilar grouping): https://www.cube.exchange/what-is/floor-price
- DEXTools — "Sweep the floor" / fake-floor in low-liquidity collections: https://www.dextools.io/tutorials/sweep-the-floor-meaning-crypto
- Beyond the Surface: Advanced Wash-Trading Detection in Decentralized NFT Markets (wash-trading distortion, false liquidity signals): https://arxiv.org/pdf/2312.16603 ; https://link.springer.com/article/10.1186/s40854-025-00766-z
- Wash trading and insider sales in NFT markets (10% wash-volume ~ 1% contemporaneous return then reversal): https://www.sciencedirect.com/science/article/abs/pii/S0378426625001499
- Tredence — Explainable AI in Finance: from black box to clarity (show which signals drove the score): https://www.tredence.com/blog/explainable-ai-in-finance
- Palo Alto Networks — Unlocking the Black Box: transparency for ML-based risk scoring: https://www.paloaltonetworks.com/blog/security-operations/unlocking-the-black-box-transparency-for-ml-based-incident-risk-scoring/
- Tableau — How to spot misleading charts: check the axes (truncated y-axis): https://www.tableau.com/blog/how-spot-misleading-charts-check-axes
- Helical Insight — Top misleading BI chart types (dual-axis implying false correlation): https://www.helicalinsight.com/top-5-misleading-bi-chart-types-youre-probably-using-and-how-to-avoid-them/
- Microsoft Learn — Anti-Corruption Layer pattern (adapter/translator/facade isolation): https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer
- Joel on Software — The Law of Leaky Abstractions: https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/
- ploeh blog — Leaky abstraction by omission (unabstracted side-channels, e.g. exceptions/async behavior): https://blog.ploeh.dk/2021/04/26/leaky-abstraction-by-omission/
- Section508.gov — Making color usage accessible (WCAG 1.4.1, don't rely on color alone): https://www.section508.gov/create/making-color-usage-accessible/
- WebAIM — Contrast and color accessibility (4.5:1 / 3:1 ratios): https://webaim.org/articles/contrast/
- Medium (Courtney Jordan) — Designing color-blind accessible dashboards (blue/green palettes, redundant cues): https://medium.com/@courtneyjordan/designing-color-blind-accessible-dashboards-ba3e0084be82
- Hackathon Guide (attainability: teams accomplish ~25% of plan; scope management): https://hackathon.guide/
- DEV Community / DoraHacks — What a good hackathon submission looks like (broken links, private repos, dead demos at submission): https://dev.to/dorahacks/what-does-a-good-hackathon-submission-look-like-5398
- Keploy — Mock testing guide (mocks create false confidence; over-specified mocks are fragile): https://keploy.io/blog/community/mock-testing

---
*Pitfalls research for: market-intelligence dashboard with explainable index + risk scoring on labeled mock data (Tessera, Renaiss hackathon)*
*Researched: 2026-07-05*
