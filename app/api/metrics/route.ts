import { getScanMetrics } from '@/lib/store';

/**
 * Aggregate-only scan metrics (no PII): total scans, distinct scanners, and
 * RETURN scanners (scanned on >=2 distinct days) — the demo-day "real users" number.
 * Durable once KV is configured; per-instance best-effort until then.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const m = await getScanMetrics();
  return Response.json({ ok: true, ...m, realUserDefinition: 'scanned on >=2 distinct days' });
}
