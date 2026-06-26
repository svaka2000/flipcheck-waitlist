import Link from 'next/link';
import { isProForUser } from '@/lib/entitlement';
import { createClient } from '@/lib/supabase/server';
import { SignIn, SignOutButton } from '@/components/auth';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="scan-shell">
      <header className="scan-top">
        <Link href="/scan" className="scan-back" aria-label="Back to scan">
          ←
        </Link>
        <span className="scan-wordmark">FlipCheck</span>
        <span style={{ width: 40 }} />
      </header>

      {!user ? (
        <section className="scan-stage" style={{ paddingTop: 28 }}>
          <h1 className="scan-item">Sign in</h1>
          <p className="scan-detail">
            Sign in to go Pro and keep unlimited scans across your devices. No password — we email you a link.
          </p>
          <SignIn next="/account" />
        </section>
      ) : (
        <AccountBody userId={user.id} email={user.email ?? ''} />
      )}
    </div>
  );
}

async function AccountBody({ userId, email }: { userId: string; email: string }) {
  const pro = await isProForUser(userId);
  return (
    <section className="scan-stage" style={{ paddingTop: 24, gap: 14 }}>
      <h1 className="scan-item">Your account</h1>
      <div className="scan-card">
        <div className="scan-eyebrow">Signed in as</div>
        <div style={{ fontWeight: 500, marginTop: 4 }}>{email}</div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="scan-eyebrow">Plan</span>
          <span className={`chip ${pro ? 'buy' : 'neutral'}`}>{pro ? 'Pro' : 'Free'}</span>
        </div>
      </div>

      {pro ? (
        <button className="btn scan-again" disabled title="Billing management activates once Stripe is connected">
          Manage billing — coming soon
        </button>
      ) : (
        <Link href="/scan" className="btn scan-again" style={{ textDecoration: 'none' }}>
          Go Pro — unlimited scans
        </Link>
      )}

      <SignOutButton />
    </section>
  );
}
