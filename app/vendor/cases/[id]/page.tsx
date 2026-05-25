'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';

export default function VendorCaseDetail({ params }: { params: { id: string } }) {
  const [c, setC] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const router = useRouter();

  async function load() {
    // Reuse the public case API — vendor RLS allows reading their cases
    const r = await fetch(`/api/cases/${params.id}`);
    if (r.ok) { const d = await r.json(); setC(d); setNotes(d.vendor_notes ?? ''); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(status: string) {
    setSaving(true);
    await fetch(`/api/vendor/cases/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    load();
  }

  async function saveNotes() {
    setSaving(true);
    await fetch(`/api/vendor/cases/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_notes: notes }),
    });
    setSaving(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 text-sm">Loading…</p></div>;
  if (!c) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-red-500 text-sm">Case not found.</p></div>;

  const isActive = !['COMPLETED','CLOSED'].includes(c.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <Link href="/vendor/cases" className="text-blue-600 text-sm">← My Jobs</Link>
        <span className="font-bold text-blue-600 ml-auto">HomeFix AI</span>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex gap-2 mb-2">
            <SeverityBadge severity={c.severity} />
            <StatusBadge status={c.status} />
            <span className="text-xs text-gray-400 ml-auto">{c.category}</span>
          </div>
          <p className="text-sm font-medium">{c.description}</p>
          {c.address && <p className="text-xs text-gray-500 mt-2">📍 {c.address}</p>}
          {c.user?.name && <p className="text-xs text-gray-500 mt-1">Tenant: {c.user.name} {c.user.phone ? `· ${c.user.phone}` : ''}</p>}
        </div>

        {/* AI Diagnosis */}
        {c.diagnosis && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 mb-1">AI DIAGNOSIS</p>
            <p className="text-sm text-blue-900">{c.diagnosis}</p>
          </div>
        )}

        {/* Safety flags */}
        {c.safety_flags?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-600 mb-1">⚠ SAFETY ALERTS</p>
            <ul className="list-disc list-inside text-red-700 text-sm space-y-0.5">
              {c.safety_flags.map((f: string, i: number) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}

        {/* Photos */}
        {c.photo_urls?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">PHOTOS</p>
            <div className="flex gap-2 flex-wrap">
              {c.photo_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="" className="h-24 w-auto rounded-lg object-cover border" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Vendor notes */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">YOUR NOTES</p>
          <textarea
            rows={3}
            placeholder="What did you find? What was done? Parts used?"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={!isActive}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
          {isActive && (
            <button onClick={saveNotes} disabled={saving}
              className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">
              {saving ? 'Saving…' : noteSaved ? '✓ Saved' : 'Save notes'}
            </button>
          )}
        </div>

        {/* Action buttons */}
        {isActive && (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 mb-3">UPDATE STATUS</p>
            {c.status === 'SCHEDULED' && (
              <button onClick={() => updateStatus('IN_PROGRESS')} disabled={saving}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Updating…' : '🚗 On my way / In progress'}
              </button>
            )}
            {(c.status === 'SCHEDULED' || c.status === 'IN_PROGRESS') && (
              <button onClick={() => updateStatus('COMPLETED')} disabled={saving}
                className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Updating…' : '✓ Mark job done'}
              </button>
            )}
          </div>
        )}

        {!isActive && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-green-700">✓ Job completed</p>
            {c.invoice_amount && <p className="text-lg font-bold text-green-600 mt-1">${Number(c.invoice_amount).toFixed(2)}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
