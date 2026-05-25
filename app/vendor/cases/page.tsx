'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';

export default function VendorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    fetch('/api/vendor/cases')
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e.error)))
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500 text-sm">Loading your jobs…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-sm w-full text-center">
        <p className="text-2xl mb-2">🔧</p>
        <p className="font-semibold mb-1">Not linked to a vendor account</p>
        <p className="text-sm text-gray-500 mb-4">Your email isn't associated with a vendor record yet. Contact your property manager.</p>
        <button onClick={signOut} className="text-sm text-gray-500 hover:underline">Sign out</button>
      </div>
    </div>
  );

  const { vendor, cases } = data;
  const open   = cases.filter((c: any) => !['COMPLETED','CLOSED'].includes(c.status));
  const closed = cases.filter((c: any) =>  ['COMPLETED','CLOSED'].includes(c.status));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div>
          <span className="font-bold text-blue-600">HomeFix AI</span>
          <span className="text-gray-400 mx-2">·</span>
          <span className="text-sm text-gray-600">{vendor.name}</span>
          {vendor.city && <span className="text-xs text-gray-400 ml-1">· {vendor.city}, {vendor.state}</span>}
        </div>
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-900">Sign out</button>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Jobs', value: cases.length },
            { label: 'Active', value: open.length, color: 'text-blue-600' },
            { label: 'Completed', value: closed.length, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color ?? 'text-gray-900'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Active jobs */}
        {open.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Jobs</h2>
            <div className="space-y-3">
              {open.map((c: any) => (
                <Link key={c.id} href={`/vendor/cases/${c.id}`}
                  className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={c.severity} />
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-sm font-medium truncate">{c.description}</p>
                      {c.address && <p className="text-xs text-gray-500 mt-0.5">📍 {c.address}</p>}
                      {c.user?.name && <p className="text-xs text-gray-400 mt-0.5">Tenant: {c.user.name}</p>}
                    </div>
                    <span className="text-blue-600 text-sm flex-shrink-0">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Completed jobs */}
        {closed.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Completed</h2>
            <div className="space-y-2">
              {closed.map((c: any) => (
                <Link key={c.id} href={`/vendor/cases/${c.id}`}
                  className="block bg-white rounded-xl shadow-sm p-4 opacity-70 hover:opacity-100 transition-opacity">
                  <p className="text-sm font-medium truncate">{c.description}</p>
                  <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {cases.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-3">🔧</p>
            <p className="font-medium text-gray-700">No jobs assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">You'll see new jobs here when a PM assigns them to you.</p>
          </div>
        )}
      </main>
    </div>
  );
}
