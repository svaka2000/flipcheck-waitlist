'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';

const SITE = 'https://flipcheck-phi.vercel.app';

type JoinState = {
  code: string;
  position: number;
  displayPosition: number;
  referrals: number;
  total: number;
  jump: number;
};

const TIERS = [
  { n: 1, reward: '1 month of FlipCheck Pro, free' },
  { n: 3, reward: '3 months of Pro + early TestFlight access' },
  { n: 5, reward: '6 months of Pro + Founding Flipper badge' },
  { n: 10, reward: 'A full year of Pro — on the house' },
];

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

export default function Page() {
  const [email, setEmail] = useState('');
  const [ref, setRef] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState<JoinState | null>(null);
  const [copied, setCopied] = useState(false);

  // capture ?ref= and any saved membership
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('ref');
    if (r) {
      setRef(r);
      try {
        localStorage.setItem('fc_ref', r);
      } catch {}
    } else {
      try {
        const saved = localStorage.getItem('fc_ref');
        if (saved) setRef(saved);
      } catch {}
    }
    // returning member?
    try {
      const myCode = localStorage.getItem('fc_code');
      if (myCode) refresh(myCode);
    } catch {}
  }, []);

  // live total
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        const data = await res.json();
        if (alive && data.ok) setTotal(data.total);
      } catch {}
    };
    pull();
    const id = setInterval(pull, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const refresh = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/stats?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        setJoined({
          code,
          position: data.position,
          displayPosition: data.displayPosition,
          referrals: data.referrals,
          total: data.total,
          jump: 50,
        });
      }
    } catch {}
  }, []);

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError('');
      const value = email.trim();
      if (!value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        setError('Please enter a valid email address.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value, ref }),
        });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error || 'Something went wrong — try again.');
          return;
        }
        setJoined({
          code: data.code,
          position: data.position,
          displayPosition: data.displayPosition,
          referrals: data.referrals,
          total: data.total,
          jump: data.jump,
        });
        setTotal(data.total);
        try {
          localStorage.setItem('fc_code', data.code);
        } catch {}
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        setError('Network error — please try again.');
      } finally {
        setLoading(false);
      }
    },
    [email, ref]
  );

  const shareUrl = joined ? `${SITE}/?ref=${joined.code}` : SITE;
  const shareText = "I just grabbed early access to FlipCheck — point your camera at any thrift find and it tells you what it's actually worth to resell. Skip the line with my link:";

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }, [shareUrl]);

  return (
    <>
      <nav className="nav">
        <div className="wrap row">
          <div className="brand">
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <rect width="34" height="34" rx="9" fill="#34e5a1" />
              <g fill="none" stroke="#06140e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9 H9 V12" />
                <path d="M22 9 H25 V12" />
                <path d="M12 25 H9 V22" />
                <path d="M22 25 H25 V22" />
                <path d="M12.5 17.5 l3 3 l6 -7" />
              </g>
            </svg>
            FlipCheck
          </div>
          <a href="/scan" className="btn cta">
            Scan free →
          </a>
        </div>
      </nav>

      <header className="hero" id="join">
        <div className="wrap hero-grid">
          <div>
            <span className="badge reveal">
              <span className="dot" />
              {total !== null ? `${fmt(total)} thrifters using FlipCheck` : 'Live now — free to try'}
            </span>

            {!joined ? (
              <>
                <h1 className="reveal d1">
                  Know what it's <span className="em">worth</span> before you buy it.
                </h1>
                <p className="sub reveal d2">
                  FlipCheck is your thrifting co-pilot. Point your camera at any thrift, garage-sale,
                  or estate find and get an instant resale range — plus a clear{' '}
                  <strong>Buy / Maybe / Skip</strong> call. No more guessing in the aisle.
                </p>
                <div className="verdicts reveal d2">
                  <span className="chip buy">BUY ↑</span>
                  <span className="chip maybe">MAYBE →</span>
                  <span className="chip skip">SKIP ↓</span>
                </div>

                <div className="reveal d3" style={{ marginTop: 30 }}>
                  <a href="/scan" className="btn" style={{ height: 56, fontSize: 17, padding: '0 28px' }}>
                    Scan something free →
                  </a>
                  <p className="formnote" style={{ marginTop: 12 }}>
                    Live now · 3 free scans · no signup needed
                  </p>
                </div>

                <p className="sub" style={{ fontSize: 15, marginTop: 28, marginBottom: 0 }}>
                  Or get launch news + Pro early access:
                </p>
                <form className="form reveal d3" style={{ marginTop: 12 }} onSubmit={submit}>
                  <div className="field">
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-label="Email address"
                    />
                    <button className="btn" type="submit" disabled={loading}>
                      {loading ? 'Joining…' : 'Join the waitlist'}
                    </button>
                  </div>
                  {error ? <div className="err">{error}</div> : null}
                  <div className="formnote">
                    <span>🔒</span> Free to join. No spam — just your spot and launch news.
                  </div>
                </form>

                <div className="counter reveal d4">
                  <div className="avatars">
                    <span /> <span /> <span /> <span />
                  </div>
                  {total !== null ? (
                    <span>
                      <b>{fmt(total)}</b> resellers already in line
                    </span>
                  ) : (
                    <span>Be one of the first in line</span>
                  )}
                </div>
              </>
            ) : (
              <SuccessCard
                joined={joined}
                shareUrl={shareUrl}
                shareText={shareText}
                copied={copied}
                onCopy={copy}
              />
            )}
          </div>

          <div className="visual reveal d2">
            <div className="phone">
              <img src="/app.png" alt="FlipCheck scanning a thrift find" />
            </div>
            <div className="float f1">
              <div className="k">Estimated resale</div>
              <div className="v">$48–$72</div>
            </div>
            <div className="float f2">
              <div className="k">Verdict</div>
              <div className="v">BUY ↑</div>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="eyebrow">How it works</div>
          <h2>Three taps from clueless to confident.</h2>
          <p className="lead">
            FlipCheck reads the item, the brand, and the condition — then checks it against real
            resale comps so you walk out with the right call.
          </p>
          <div className="steps">
            <div className="step">
              <div className="n">1</div>
              <h4>Point</h4>
              <p>Open the camera on anything — sneakers, vintage tees, electronics, decor, toys.</p>
            </div>
            <div className="step">
              <div className="n">2</div>
              <h4>Scan</h4>
              <p>AI vision IDs the piece and pulls an estimated resale range in seconds.</p>
            </div>
            <div className="step">
              <div className="n">3</div>
              <h4>Decide</h4>
              <p>Get a Buy / Maybe / Skip verdict with the margin math, before you spend a dime.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">Why flippers want it</div>
          <h2>Built for the aisle, not the spreadsheet.</h2>
          <div className="features">
            <div className="feature">
              <div className="ic">⚡</div>
              <div>
                <h4>Instant verdicts</h4>
                <p>No typing model numbers or digging through sold listings. Aim and know.</p>
              </div>
            </div>
            <div className="feature">
              <div className="ic">💸</div>
              <div>
                <h4>Margin-aware</h4>
                <p>It factors in fees and condition so the number is what you'd actually pocket.</p>
              </div>
            </div>
            <div className="feature">
              <div className="ic">🧠</div>
              <div>
                <h4>Knows the niches</h4>
                <p>Sneakers, vintage, electronics, collectibles, home goods — one tool, every bin.</p>
              </div>
            </div>
            <div className="feature">
              <div className="ic">📈</div>
              <div>
                <h4>Flip history</h4>
                <p>Every scan is saved so you can track finds and build your sourcing instincts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">FAQ</div>
          <h2>The quick questions.</h2>
          <div className="faq">
            <div className="qa">
              <h4>When does FlipCheck launch?</h4>
              <p>
                We're rolling out on iOS first, in waves. The higher your spot, the sooner you're
                in — and referrals jump you up the line.
              </p>
            </div>
            <div className="qa">
              <h4>How do I move up the waitlist?</h4>
              <p>
                Share your personal link. Every friend who joins moves you up {joined?.jump ?? 50}{' '}
                spots, and you unlock free months of Pro along the way.
              </p>
            </div>
            <div className="qa">
              <h4>Is it free?</h4>
              <p>
                Joining is free, and you'll get free scans at launch. Pro unlocks unlimited scans —
                and waitlist referrers earn months of it for free.
              </p>
            </div>
            <div className="qa">
              <h4>How accurate are the estimates?</h4>
              <p>
                FlipCheck gives a realistic resale range from current market signals — a confident
                gut-check to source faster, not a guaranteed sale price.
              </p>
            </div>
          </div>
        </div>
      </section>

      {!joined ? (
        <section className="cta-band">
          <div className="wrap">
            <div className="eyebrow">Don't pay retail for resale</div>
            <h2>Get FlipCheck before your next thrift run.</h2>
            <p className="lead" style={{ margin: '14px auto 0' }}>
              Join {total !== null ? fmt(total) : 'the'} resellers already in line.
            </p>
            <form className="form" onSubmit={submit}>
              <div className="field">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? 'Joining…' : 'Claim my spot'}
                </button>
              </div>
              {error ? <div className="err">{error}</div> : null}
            </form>
          </div>
        </section>
      ) : null}

      <footer>
        <div className="wrap row">
          <div>© {new Date().getFullYear()} FlipCheck. Thrift smarter.</div>
          <div style={{ display: 'flex', gap: 18 }}>
            <a href="https://flipcheck-proxy.vercel.app/privacy.html">Privacy</a>
            <a href="https://flipcheck-proxy.vercel.app/terms.html">Terms</a>
            <a href="https://flipcheck-proxy.vercel.app/support.html">Support</a>
          </div>
        </div>
      </footer>
    </>
  );
}

function SuccessCard({
  joined,
  shareUrl,
  shareText,
  copied,
  onCopy,
}: {
  joined: JoinState;
  shareUrl: string;
  shareText: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const sms = `sms:?&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  const next = TIERS.find((t) => joined.referrals < t.n);
  const toGo = next ? next.n - joined.referrals : 0;
  const pct = next ? Math.min(100, Math.round((joined.referrals / next.n) * 100)) : 100;

  return (
    <div className="success reveal">
      <h3>You're on the list. 🎉</h3>
      <div className="pos">
        <span className="num">#{fmt(joined.displayPosition)}</span>
        <span className="lbl">
          your spot{joined.referrals > 0 ? ` · jumped ${fmt(joined.referrals * joined.jump)} with referrals` : ''}
        </span>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 15 }}>
        Want in sooner? Every friend who joins with your link moves you up{' '}
        <strong style={{ color: 'var(--text)' }}>{joined.jump} spots</strong> and unlocks free Pro.
      </p>

      <div className="reflink">
        <input value={shareUrl} readOnly onFocus={(e) => e.currentTarget.select()} />
        <button className="btn" style={{ height: 48, padding: '0 18px' }} onClick={onCopy}>
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
      </div>

      <div className="share">
        <a href={tweet} target="_blank" rel="noreferrer">𝕏 / Twitter</a>
        <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
        <a href={sms}>Text a friend</a>
      </div>

      <div className="bar">
        <div style={{ width: `${pct}%` }} />
      </div>
      <p style={{ color: 'var(--dim)', fontSize: 13.5, marginBottom: 4 }}>
        {next
          ? `${joined.referrals} referral${joined.referrals === 1 ? '' : 's'} · ${toGo} more to unlock “${next.reward}”`
          : 'Every reward unlocked — you legend. 🏆'}
      </p>

      <div className="tiers">
        {TIERS.map((t) => {
          const done = joined.referrals >= t.n;
          return (
            <div key={t.n} className={`tier${done ? ' done' : ''}`}>
              <span className="mark">{done ? '✓' : t.n}</span>
              <span>
                Refer <b>{t.n}</b> → {t.reward}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
