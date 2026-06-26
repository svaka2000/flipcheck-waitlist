import { cookies } from 'next/headers';

/**
 * Same-origin scan gateway. The browser posts {imageBase64, profitThreshold} here;
 * we resolve a stable anonymous device id (httpOnly cookie) for the free-scan cap,
 * compute Pro entitlement SERVER-SIDE (so the client can never spoof `entitled`),
 * then call the existing flipcheck-proxy vision endpoint server-to-server.
 *
 * Entitlement is hard-false until magic-link auth + the Supabase `subscriptions`
 * table land (build phases B/C). The proxy enforces the free cap by userId.
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

  // Anonymous device id = free-cap key. Generated once, pinned in an httpOnly cookie.
  const jar = await cookies();
  let did = jar.get('fc_did')?.value;
  const isNew = !did;
  if (!did) did = crypto.randomUUID();

  // TODO(phase C): const entitled = await isProForSession(); — query Supabase subscriptions.
  const entitled = false;

  let upstream: Response;
  try {
    upstream = await fetch(`${PROXY}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, userId: did, profitThreshold, entitled }),
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

  const res = Response.json(data, { status: upstream.status });
  if (isNew) {
    res.headers.append(
      'Set-Cookie',
      `fc_did=${did}; Path=/; Max-Age=${60 * 60 * 24 * 365}; HttpOnly; SameSite=Lax`
    );
  }
  return res;
}
