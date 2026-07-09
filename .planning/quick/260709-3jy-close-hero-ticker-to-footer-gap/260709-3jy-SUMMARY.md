---
quick_id: 260709-3jy
slug: close-hero-ticker-to-footer-gap
date: 2026-07-09
status: complete
commit: cc81e3b
---

# Quick Task 260709-3jy: Close the hero-ticker → footer gap

## Problem
56px of cream body background showed between the hero's marquee ticker and the dark footer band on
the landing page — `Footer.tsx` root carried `marginTop: 56`, and the footer renders only on home,
immediately after the ticker, so the margin read as a visual break rather than spacing.

## Fix
Removed `marginTop: 56` from the footer root (one line). Footer is home-only (App.tsx), so no other
screen is affected.

## Verification
- Dev preview DOM measurement: heroBottom === footerTop (gap **0px**, computed marginTop 0px).
- Live (www.tesseraindex.xyz) after `vercel --prod`: gap **0px**.
- tsc + build green. Commit cc81e3b (Bensage, no attribution).
