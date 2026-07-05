'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { compressForScan } from '@/lib/image';

type Verdict = 'BUY' | 'MAYBE' | 'SKIP';
type Confidence = 'High' | 'Medium' | 'Low';
interface ScanResult {
  itemName: string;
  category: string;
  detail: string;
  conditionNotes: string;
  valueLow: number;
  valueHigh: number;
  confidence: Confidence;
  verdict: Verdict;
  verifyChecklist: string[];
  sellChannels?: { platform: string; why: string }[];
}

type Stage = 'idle' | 'analyzing' | 'result' | 'limit' | 'error';

const THRESHOLDS = [20, 30, 50];
const verdictClass: Record<Verdict, string> = { BUY: 'buy', MAYBE: 'maybe', SKIP: 'skip' };
const verdictArrow: Record<Verdict, string> = { BUY: '↑', MAYBE: '→', SKIP: '↓' };

export default function ScanPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [profit, setProfit] = useState(30);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');

  const pick = useCallback(() => fileRef.current?.click(), []);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ''; // allow re-picking the same file
      if (!file) return;
      setError('');
      setResult(null);
      try {
        const img = await compressForScan(file);
        setPreview(img.dataUrl);
        setStage('analyzing');
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: img.base64, profitThreshold: profit }),
        });
        const data = await res.json();
        if (res.status === 402 || data.code === 'LIMIT_REACHED') {
          setRemaining(0);
          setStage('limit');
          return;
        }
        if (!res.ok || !data.ok || !data.result) {
          setError(messageFor(data.code) || data.error || 'Something went wrong. Try another photo.');
          setStage('error');
          return;
        }
        setResult(data.result);
        if (typeof data.scansRemaining === 'number') setRemaining(data.scansRemaining);
        setStage('result');
      } catch {
        setError('Could not read that image. Try again.');
        setStage('error');
      }
    },
    [profit]
  );

  const reset = useCallback(() => {
    setStage('idle');
    setResult(null);
    setPreview(null);
    setError('');
  }, []);

  return (
    <div className="scan-shell">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        style={{ display: 'none' }}
      />

      <header className="scan-top">
        <Link href="/" className="scan-back" aria-label="Home">
          ←
        </Link>
        <span className="scan-wordmark">FlipCheck</span>
        <span className="scan-remain">
          {remaining === null ? '3 free scans' : `${remaining} left`}
        </span>
      </header>

      {stage === 'idle' && (
        <section className="scan-stage">
          <div className="scan-frame" onClick={pick} role="button" tabIndex={0}>
            <span className="brk tl" /> <span className="brk tr" />
            <span className="brk bl" /> <span className="brk brr" />
            <div className="scan-frame-inner">
              <div className="scan-cam-ic">⊹</div>
              <div className="scan-frame-hint">Tap to point your camera at one item</div>
            </div>
          </div>

          <div className="scan-profit">
            <span className="scan-profit-label">Only flag BUY above</span>
            <div className="scan-profit-chips">
              {THRESHOLDS.map((t) => (
                <button
                  key={t}
                  className={`scan-pchip${profit === t ? ' on' : ''}`}
                  onClick={() => setProfit(t)}
                >
                  ${t}
                </button>
              ))}
            </div>
          </div>

          <button className="btn scan-shutter" onClick={pick}>
            Scan an item
          </button>
          <p className="scan-foot">Gut-check resale value in seconds.</p>
        </section>
      )}

      {stage === 'analyzing' && (
        <section className="scan-stage">
          {preview && <img className="scan-preview" src={preview} alt="" />}
          <div className="scan-analyzing">
            <div className="scan-spinner" />
            <div className="scan-analyzing-title">Reading the item…</div>
            <div className="scan-analyzing-sub">Checking resale comps + condition</div>
          </div>
        </section>
      )}

      {stage === 'result' && result && (
        <section className="scan-stage result">
          {preview && (
            <div className="scan-photo" style={{ backgroundImage: `url(${preview})` }} />
          )}
          <span className={`vbanner ${verdictClass[result.verdict]}`}>
            {result.verdict} {verdictArrow[result.verdict]}
          </span>
          <h1 className="scan-item">{result.itemName}</h1>
          <div className="scan-tags">
            <span className="chip neutral">{result.category}</span>
            <span className={`chip conf-${result.confidence.toLowerCase()}`}>
              ● {result.confidence} confidence
            </span>
          </div>

          <div className="scan-card">
            <div className="scan-eyebrow">Estimated resale value</div>
            <div className="scan-price">
              ${result.valueLow} <span>–</span> ${result.valueHigh}
            </div>
            <div className="scan-card-sub">secondary-market range</div>
          </div>

          {result.detail && <p className="scan-detail">{result.detail}</p>}

          {result.conditionNotes && (
            <div className="scan-block">
              <div className="scan-eyebrow">Condition</div>
              <p>{result.conditionNotes}</p>
            </div>
          )}

          {result.verifyChecklist?.length > 0 && (
            <div className="scan-block">
              <div className="scan-eyebrow">Before you buy</div>
              <ul className="scan-check">
                {result.verifyChecklist.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {result.sellChannels && result.sellChannels.length > 0 && (
            <div className="scan-block">
              <div className="scan-eyebrow">Where to sell it for the most</div>
              <ul className="sell-list">
                {result.sellChannels.map((c, i) => (
                  <li key={i}>
                    <span className="sell-plat">{c.platform}</span>
                    {c.why ? <span className="sell-why">{c.why}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className="btn scan-again" onClick={reset}>
            Scan another
          </button>
        </section>
      )}

      {stage === 'limit' && (
        <section className="scan-stage center">
          <div className="scan-cam-ic big">✦</div>
          <h1 className="scan-item">You've used your free scans</h1>
          <p className="scan-detail">
            FlipCheck Pro unlocks unlimited scans, price history, and the sharpest verdicts.
          </p>
          <div className="scan-card pro">
            <div className="scan-plan">
              <div>
                <strong>Monthly</strong>
                <span className="scan-card-sub">billed monthly</span>
              </div>
              <div className="scan-plan-price">$6.99</div>
            </div>
            <div className="scan-plan featured">
              <div>
                <strong>Annual</strong> <span className="chip buy small">Save 52%</span>
                <span className="scan-card-sub">$39.99 / year · 7-day free trial</span>
              </div>
              <div className="scan-plan-price">
                $3.33<small>/mo</small>
              </div>
            </div>
          </div>
          <button className="btn scan-again" disabled title="Checkout activates once payments are set up">
            Go Pro — coming this week
          </button>
          <button className="scan-link" onClick={reset}>
            Back
          </button>
        </section>
      )}

      {stage === 'error' && (
        <section className="scan-stage center">
          <div className="scan-cam-ic big">!</div>
          <h1 className="scan-item">{error}</h1>
          <button className="btn scan-again" onClick={reset}>
            Try again
          </button>
        </section>
      )}
    </div>
  );
}

function messageFor(code?: string): string | null {
  switch (code) {
    case 'BAD_IMAGE':
      return 'That image didn’t come through. Try another photo.';
    case 'BAD_JSON':
      return 'Couldn’t read that one — try a clearer, closer shot.';
    case 'NO_KEY':
      return 'The scan service is being set up. Try again shortly.';
    case 'UPSTREAM':
    case 'NETWORK':
      return 'The scan service is busy. Give it another go.';
    default:
      return null;
  }
}
