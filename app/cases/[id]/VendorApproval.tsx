'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Vendor {
  id: string;
  name: string;
  phone: string;
  tier: string;
  rating: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
}

export default function VendorApproval({ caseId, vendors }: { caseId: string; vendors: Vendor[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  async function approveVendor(vendorId: string) {
    setLoading(vendorId);
    const res = await fetch(`/api/cases/${caseId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId }),
    });
    if (res.ok) {
      setApproved(true);
      router.refresh();
    }
    setLoading(null);
  }

  if (approved) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
      Vendor approved and notified via SMS.
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <p className="text-sm font-semibold mb-1">Suggested Vendors</p>
      <p className="text-xs text-gray-500 mb-4">Approve one to notify them via SMS and assign to this case.</p>
      <div className="space-y-3">
        {vendors.map((v, i) => (
          <div key={v.id} className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">#{i + 1}</span>
                <span className="font-medium text-sm">{v.name}</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{v.tier}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                ★ {v.rating.toFixed(1)} · {v.phone}
                {v.hourly_rate_min && ` · $${v.hourly_rate_min}–$${v.hourly_rate_max}/hr`}
              </p>
            </div>
            <button
              onClick={() => approveVendor(v.id)}
              disabled={loading !== null}
              className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === v.id ? 'Notifying…' : 'Approve & Notify'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
