'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const supabase = createBrowserClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    // ?error=link_expired from our callback route
    if (searchParams.get('error') === 'link_expired') setLinkExpired(true);
    // #error=access_denied sent directly by Supabase for fully invalid/expired OTPs
    if (window.location.hash.includes('error=access_denied')) {
      setLinkExpired(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLinkExpired(false);
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || location.origin}/auth/callback` },
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">HomeFix AI</h1>
        <p className="text-gray-500 text-sm mb-6">Sign in with your email</p>

        {linkExpired && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">⏱ Link expired</p>
            <p className="text-xs text-amber-700 mt-0.5">Magic links are valid for 1 hour. Enter your email below to get a fresh one.</p>
          </div>
        )}

        {sent ? (
          <p className="text-green-600 text-sm">Check your email for a magic link. It expires in 1 hour.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
