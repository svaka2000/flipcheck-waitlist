import { cookies } from 'next/headers';
import { isProForUser } from '@/lib/entitlement';
import { recordScanMetric } from '@/lib/store';
import { createClient } from '@/lib/supabase/server';

/**
 * Same-origin scan gateway. Resolves identity + entitlement SERVER-SIDE, then calls the
 * flipcheck-proxy vision endpoint server-to-server (the client can never spoof `entitled`).
 *
 * - Signed-in user  → userId = user.id, entitled = active Pro subscription (Supabase, RLS).
 * - Anonymous       → userId = stable httpOnly device cookie (fc_did), entitled = false.
 * The proxy enforces the free-scan cap by userId; entitled lifts it for Pro.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROXY = (process.env.PROXY_URL || 'https://flipcheck-proxy.vercel.app').replace(/\/+$/, '');

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
  const profitThreshold = Number(body.profitThreshold) || 30;
  if (!imageBase64) {
    return Response.json({ ok: false, code: 'BAD_IMAGE', error: 'Missing image.' }, { status: 400 });
  }

  let userId: string;
  let entitled = false;
  let newDeviceId: string | null = null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    userId = user.id;
    entitled = await isProForUser(user.id);
  } else {
    const jar = await cookies();
    const existing = jar.get('fc_did')?.value;
    userId = existing || crypto.randomUUID();
    if (!existing) newDeviceId = userId;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${PROXY}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, userId, profitThreshold, entitled }),
      cache: 'no-store',
    });
  } catch {
    return Response.json({ ok: false, code: 'NETWORK', error: 'Could not reach the scan service.' }, { status: 502 });
  }

  let data: any = {};
  try {
    data = await upstream.json();
  } catch {
    return Response.json({ ok: false, code: 'UPSTREAM', error: 'Bad response from scan service.' }, { status: 502 });
  }

  // Retention metric: device reports its distinct scan-day count; >=2 = return scanner.
  if (data?.ok) {
    const days = Number(req.headers.get('x-fc-days')) || 1;
    recordScanMetric(userId, days).catch(() => {});
  }

  const res = Response.json(data, { status: upstream.status });
  if (newDeviceId) {
    res.headers.append(
      'Set-Cookie',
      `fc_did=${newDeviceId}; Path=/; Max-Age=${60 * 60 * 24 * 365}; HttpOnly; SameSite=Lax`
    );
  }
  return res;
}
