import { join, validEmail, displayPosition, REFERRAL_JUMP } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const email = typeof body.email === 'string' ? body.email : '';
  const ref = typeof body.ref === 'string' ? body.ref : null;
  if (!email || !validEmail(email)) {
    return Response.json({ ok: false, error: 'Please enter a valid email.' }, { status: 400 });
  }
  try {
    const r = await join(email, ref);
    return Response.json({
      ok: true,
      code: r.code,
      position: r.position,
      displayPosition: displayPosition(r.position, r.referrals),
      referrals: r.referrals,
      total: r.total,
      created: r.created,
      jump: REFERRAL_JUMP,
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: 'Something went wrong — try again.' }, { status: 500 });
  }
}
