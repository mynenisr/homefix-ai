import { createServerClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import VendorApproval from './VendorApproval';

export default async function CaseDetail({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: c } = await supabase
    .from('cases')
    .select('*, user:users(name, email), vendor:vendors(name, phone, tier, rating), timeline:case_timeline(*)')
    .eq('id', params.id)
    .single();

  if (!c) notFound();

  // Fetch suggested vendors if case is TRIAGED or MATCHING
  let suggestedVendors: any[] = [];
  if (['TRIAGED', 'MATCHING'].includes(c.status)) {
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .contains('categories', [c.category])
      .eq('is_active', true)
      .order('tier', { ascending: false })
      .order('rating', { ascending: false })
      .limit(3);
    suggestedVendors = data ?? [];
  }

  const timeline = (c.timeline ?? []).sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Case #{c.id.slice(0, 8)}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Submitted by {c.user?.name ?? 'Unknown'} · {new Date(c.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <SeverityBadge severity={c.severity} />
            <StatusBadge status={c.status} />
          </div>
        </div>

        {/* Safety alert */}
        {c.safety_flags?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-semibold text-red-700 text-sm mb-1">⚠ Safety Alerts</p>
            <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
              {c.safety_flags.map((f: string, i: number) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Left column */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
              <p className="text-sm">{c.description}</p>
              {c.address && <p className="text-xs text-gray-400 mt-2">📍 {c.address}</p>}
            </div>

            {c.diagnosis && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <p className="text-sm font-medium text-gray-500 mb-2">AI Diagnosis</p>
                <p className="text-sm">{c.diagnosis}</p>
                {c.confidence && (
                  <p className="text-xs text-gray-400 mt-2">Confidence: {Math.round(c.confidence * 100)}%</p>
                )}
              </div>
            )}

            {c.playbook?.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-5">
                <p className="text-sm font-medium text-blue-700 mb-3">DIY Playbook</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  {c.playbook.map((step: string, i: number) => (
                    <li key={i} className="text-sm text-blue-800">{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Vendor approval section */}
            {suggestedVendors.length > 0 && (
              <VendorApproval caseId={c.id} vendors={suggestedVendors} />
            )}

            {/* Assigned vendor */}
            {c.vendor && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <p className="text-sm font-medium text-gray-500 mb-2">Assigned Vendor</p>
                <p className="font-medium">{c.vendor.name}</p>
                <p className="text-sm text-gray-500">{c.vendor.phone}</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{c.vendor.tier}</span>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500 mb-4">Timeline</p>
            <div className="space-y-4">
              {timeline.map((t: any) => (
                <div key={t.id} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{t.actor} · {new Date(t.created_at).toLocaleTimeString()}</p>
                    <p className="text-sm">{t.description}</p>
                  </div>
                </div>
              ))}
              {!timeline.length && <p className="text-xs text-gray-400">No events yet.</p>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
