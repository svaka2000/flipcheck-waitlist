import { total, statusOf, displayPosition } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code');
  if (code) {
    const s = await statusOf(code);
    if (!s) return Response.json({ ok: false }, { status: 404 });
    return Response.json({
      ok: true,
      position: s.position,
      displayPosition: displayPosition(s.position, s.referrals),
      referrals: s.referrals,
      total: s.total,
    });
  }
  return Response.json({ ok: true, total: await total() });
}
