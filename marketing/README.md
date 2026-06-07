# FlipCheck → 10,000 Waitlist Playbook

**Live waitlist:** https://flipcheck-phi.vercel.app
**Referral link format:** `https://flipcheck-phi.vercel.app/?ref=CODE`

This is the complete distribution engine. The product is the machine; this folder is
the fuel. Work it top to bottom.

---

## The honest math (read this first)

You cannot conjure 10,000 real humans with a button — and a waitlist full of fake
emails is worthless (it can't convert, can't refer, and poisons your launch metrics).
10k real signups is a **distribution grind**, and here's the actual funnel:

| Lever | Realistic number |
|---|---|
| Landing page conversion (visitor → signup) | 3–6% (ours is built to hit the top of that) |
| Viral coefficient `k` (avg referred signups per member) | 0.3–0.5 for a good loop |
| Amplification from the loop `1/(1-k)` | ~1.4–2.0× your seed |

**So:** to land **10,000** signups at `k = 0.4` (≈1.67× amplification), you need to
**seed ~6,000** signups yourself. At a 4% landing conversion that's **~150,000
qualified visits** — which is *very* doable in the thrift/reseller niche because a
single good TikTok flip video routinely does 100k–1M views.

> The whole strategy: **make 2–4 short videos/week + post value in reseller
> communities → seed thousands of visits → the in-product referral loop multiplies
> them.** Consistency over weeks is what gets to 10k. There is no shortcut, and
> anyone selling you one is selling fake emails.

---

## What's already built (the machine)

- ✅ **High-converting landing page** — hero, live counter, social proof, FAQ, dual CTAs
- ✅ **Viral referral loop** — every signup gets a unique link; each referral jumps them
  **+50 spots** and unlocks free Pro (refer 1 → 1mo, 3 → 3mo, 5 → 6mo, 10 → 1 year)
- ✅ **Frictionless share** — one-tap copy + X / WhatsApp / SMS share with pre-written copy
- ✅ **Live social-proof counter** — “N thrifters on the waitlist,” updates in real time
- ✅ **OG image + metadata** — every shared link unfurls into a branded card

## What turns it on for real (your 2 gates)

1. **Durable storage (Upstash KV)** — accept the marketplace terms once (see
   `../HANDOFF` note), then signups persist forever and counts are accurate.
2. **Your accounts for posting** — I can't post to your TikTok/X/Reddit for you. The
   scripts below are copy-paste ready; you (or a scheduler) hit publish.

---

## Order of operations (week 1)

1. **Day 0** — Turn on KV (durability). Seed the list with 20–50 friends/family so the
   counter isn't at 0 (social proof). Ask each to use their referral link.
2. **Day 1** — Post the **build-in-public X thread** + **r/Flipping value post**.
3. **Day 2–7** — Ship **1 short video/day** (TikTok + Reels + Shorts, same clip).
   Pin the waitlist link in bio + comment.
4. **Day 5** — **Product Hunt "Coming Soon"** page live; start collecting followers.
5. **Ongoing** — Submit to every directory in `directories.md`. DM creators from
   `creators.md` (10/day). Reply to every "is this worth it?" thread with genuine help
   + a soft mention.

## Channel files

- `reddit.md` — subreddits + value-first post scripts (the #1 free channel for this niche)
- `tiktok-reels.md` — short-video hooks & scripts (the #1 growth lever, do these daily)
- `twitter-x.md` — launch thread + build-in-public cadence
- `product-hunt.md` — Coming Soon + launch-day kit
- `directories.md` — 30+ places to list the waitlist
- `creators.md` — reseller-creator outreach targets + DM templates

## Track what works

Use UTM tags on every link so you know what's actually driving signups:
`?ref=CODE&utm_source=tiktok&utm_medium=video&utm_campaign=launch`
(The app reads `ref`; UTMs are just for your analytics.)
