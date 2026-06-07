# FlipCheck Waitlist — Status & Handoff

**Live:** https://flipcheck-phi.vercel.app
**Repo:** https://github.com/svaka2000/flipcheck-waitlist
**Vercel project:** svaka2000s-projects/flipcheck

## ✅ Done & verified

- Viral waitlist landing page (Next.js 16) — hero, live counter, email capture, How-it-works,
  features, FAQ, dual CTAs, mobile-responsive, dark/emerald brand matching the app.
- Referral loop: unique code per signup, **+50 spots per referral**, tiered Pro rewards
  (refer 1/3/5/10 → 1mo / 3mo / 6mo / 1yr free), one-tap X/WhatsApp/SMS share + copy.
- `/api/join` + `/api/stats` — verified end-to-end: join, referral credit, position-skip
  math, dedupe by email, email validation, live total.
- OG image + favicon + metadata (links unfurl into a branded card).
- Full distribution kit in `marketing/` (Reddit, TikTok/Reels, X, Product Hunt,
  directories, creator outreach) + the honest funnel math to reach 10k.

## ⚠️ 2 gates only you can clear (each ~1–2 min)

### Gate 1 — Durable storage (do this first)
Right now signups use an in-memory fallback that **resets on serverless cold starts** — so
counts aren't yet permanent. To make them permanent (free tier is plenty):

**Option A (1 click, browser):**
1. Vercel → project **flipcheck** → **Storage** → **Upstash for Redis** → Create.
   Accept the Upstash marketplace terms when prompted. It auto-injects
   `KV_REST_API_URL` + `KV_REST_API_TOKEN`.
2. Redeploy: `cd ~/flipcheck-waitlist && vercel deploy --prod --yes --scope svaka2000s-projects`

**Option B (terminal, after you've read Upstash's terms):**
```
vercel --scope svaka2000s-projects integration accept-terms upstash --yes
vercel --scope svaka2000s-projects integration add upstash/upstash-kv \
  --environment production --environment preview --environment development
vercel deploy --prod --yes --scope svaka2000s-projects
```
The store auto-detects the KV env vars — no code change needed. (`lib/store.ts`.)

> I did not auto-accept the third-party legal terms (EULA + privacy policy) on your
> behalf — that's the one thing I won't click for you.

### Gate 2 — Posting (your accounts)
I built every script but can't post to your TikTok/X/Reddit. Work `marketing/README.md`
top to bottom. The single biggest lever: **1 short thrift-scan video/day.**

## Day-0 seeding (do right after Gate 1)
Sign up 20–50 friends/family and have each use their referral link, so the live counter
shows real social proof instead of 0. Then start the channel plan.

## Custom domain (optional, nice-to-have)
`flipcheck.vercel.app` is taken by another project; we're on `flipcheck-phi.vercel.app`.
If you want a cleaner URL, add a custom domain in Vercel (e.g. getflipcheck.com) and
update `SITE` in `app/page.tsx` + `app/layout.tsx`, then redeploy.

## Operating the waitlist
- Live count: `curl https://flipcheck-phi.vercel.app/api/stats`
- A member's status: `curl "https://flipcheck-phi.vercel.app/api/stats?code=CODE"`
