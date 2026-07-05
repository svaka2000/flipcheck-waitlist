/**
 * Waitlist store. Uses Upstash/Vercel KV (Redis REST) when KV_REST_API_URL + KV_REST_API_TOKEN
 * are set; otherwise an in-memory fallback so the app always runs. Atomic INCR powers positions
 * and referral counts — the mechanics a viral waitlist needs.
 *
 * Keys: wl:count (total/position counter) · wl:email:<email> -> code · wl:code:<code> -> JSON
 *       wl:ref:<code> -> referral count
 */
export const REFERRAL_JUMP = 50; // spots skipped per successful referral

type Rec = { email: string; code: string; position: number; referredBy: string | null; createdAt: number };
export type JoinResult = { code: string; position: number; referrals: number; total: number; created: boolean };

const URL_ = (process.env.KV_REST_API_URL || '').replace(/\/+$/, '');
const TOKEN = process.env.KV_REST_API_TOKEN || '';
export const kvEnabled = !!(URL_ && TOKEN);

async function cmd(args: (string | number)[]): Promise<any> {
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`KV ${res.status}`);
  return (await res.json()).result;
}

// ---- in-memory fallback (dev / before KV is connected) ----
const mem = {
  count: 0,
  byEmail: new Map<string, string>(),
  byCode: new Map<string, Rec>(),
  refs: new Map<string, number>(),
};

const normEmail = (e: string) => e.trim().toLowerCase();
export const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export async function join(emailRaw: string, ref: string | null): Promise<JoinResult> {
  const email = normEmail(emailRaw);
  const cleanRef = ref && /^[A-Z0-9]{4,10}$/.test(ref) ? ref : null;

  if (kvEnabled) {
    const existingCode = await cmd(['GET', `wl:email:${email}`]);
    if (existingCode) {
      const rec: Rec = JSON.parse(await cmd(['GET', `wl:code:${existingCode}`]));
      const referrals = Number(await cmd(['GET', `wl:ref:${existingCode}`])) || 0;
      const total = Number(await cmd(['GET', 'wl:count'])) || rec.position;
      return { code: existingCode, position: rec.position, referrals, total, created: false };
    }
    const code = genCode();
    const position = Number(await cmd(['INCR', 'wl:count']));
    const rec: Rec = { email, code, position, referredBy: cleanRef, createdAt: Date.now() };
    await cmd(['SET', `wl:code:${code}`, JSON.stringify(rec)]);
    await cmd(['SET', `wl:email:${email}`, code]);
    if (cleanRef && cleanRef !== code) {
      const exists = await cmd(['GET', `wl:code:${cleanRef}`]);
      if (exists) await cmd(['INCR', `wl:ref:${cleanRef}`]);
    }
    return { code, position, referrals: 0, total: position, created: true };
  }

  if (mem.byEmail.has(email)) {
    const code = mem.byEmail.get(email)!;
    const rec = mem.byCode.get(code)!;
    return { code, position: rec.position, referrals: mem.refs.get(code) || 0, total: mem.count, created: false };
  }
  const code = genCode();
  mem.count += 1;
  mem.byCode.set(code, { email, code, position: mem.count, referredBy: cleanRef, createdAt: Date.now() });
  mem.byEmail.set(email, code);
  if (cleanRef && cleanRef !== code && mem.byCode.has(cleanRef)) {
    mem.refs.set(cleanRef, (mem.refs.get(cleanRef) || 0) + 1);
  }
  return { code, position: mem.count, referrals: 0, total: mem.count, created: true };
}

export async function statusOf(code: string): Promise<JoinResult | null> {
  if (kvEnabled) {
    const raw = await cmd(['GET', `wl:code:${code}`]);
    if (!raw) return null;
    const rec: Rec = JSON.parse(raw);
    const referrals = Number(await cmd(['GET', `wl:ref:${code}`])) || 0;
    const total = Number(await cmd(['GET', 'wl:count'])) || rec.position;
    return { code, position: rec.position, referrals, total, created: false };
  }
  const rec = mem.byCode.get(code);
  if (!rec) return null;
  return { code, position: rec.position, referrals: mem.refs.get(code) || 0, total: mem.count, created: false };
}

// Short in-process TTL cache: the landing polls the count every ~8s per visitor, so this
// collapses those repeated KV reads (per serverless instance) for a slowly-changing number.
let totalCache: { value: number; at: number } | null = null;
const TOTAL_TTL_MS = 10_000;

export async function total(): Promise<number> {
  const now = Date.now();
  if (totalCache && now - totalCache.at < TOTAL_TTL_MS) return totalCache.value;
  const value = kvEnabled ? Number(await cmd(['GET', 'wl:count'])) || 0 : mem.count;
  totalCache = { value, at: now };
  return value;
}

/** Displayed position after "skip the line" credit. */
export const displayPosition = (position: number, referrals: number) =>
  Math.max(1, position - referrals * REFERRAL_JUMP);
