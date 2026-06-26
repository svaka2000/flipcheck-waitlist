'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Passwordless email sign-in (magic link). Stays in one tab; link returns to /auth/callback. */
export function SignIn({ next = '/scan' }: { next?: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setErr('Enter a valid email.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) setErr(error.message);
      else setSent(true);
    } catch {
      setErr('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="scan-card" style={{ textAlign: 'center' }}>
        <div className="scan-cam-ic" style={{ fontSize: 32 }}>✉</div>
        <p style={{ marginTop: 10, fontWeight: 500 }}>Check your email</p>
        <p className="scan-card-sub" style={{ marginTop: 4 }}>
          We sent a sign-in link to {email}. Open it on this device.
        </p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit} style={{ marginTop: 0 }}>
      <div className="field">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email"
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Email me a link'}
        </button>
      </div>
      {err ? <div className="err">{err}</div> : null}
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      className="scan-link"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await createClient().auth.signOut();
        router.replace('/');
        router.refresh();
      }}
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
