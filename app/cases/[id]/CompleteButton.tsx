'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompleteButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function markComplete() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    const res = await fetch(`/api/cases/${caseId}/complete`, { method: 'POST' });
    if (res.ok) router.refresh();
    else setLoading(false);
    setConfirmed(false);
  }

  return (
    <button
      onClick={markComplete}
      disabled={loading}
      className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
        confirmed
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } disabled:opacity-50`}
    >
      {loading ? 'Updating…' : confirmed ? 'Confirm complete?' : 'Mark as Complete'}
    </button>
  );
}
