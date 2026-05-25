'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompleteButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<'idle' | 'form' | 'saving'>('idle');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  async function markComplete() {
    setStep('saving');
    const res = await fetch(`/api/cases/${caseId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_amount: amount ? Number(amount) : null,
        invoice_notes: notes || null,
      }),
    });
    if (res.ok) router.refresh();
    else setStep('form');
  }

  if (step === 'idle') {
    return (
      <button onClick={() => setStep('form')}
        className="text-sm px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
        Mark as Complete
      </button>
    );
  }

  if (step === 'form') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-green-800">Complete this job</p>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Invoice amount (optional)</label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">$</span>
            <input
              type="number" min="0" step="0.01" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Notes / what was done (optional)</label>
          <textarea
            rows={2} placeholder="e.g. Replaced faucet cartridge, tested for 10 min — no leaks."
            value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={markComplete}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 font-medium">
            ✓ Confirm Complete
          </button>
          <button onClick={() => setStep('idle')}
            className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button disabled className="text-sm px-4 py-2 rounded-lg bg-green-600 text-white opacity-50">
      Saving…
    </button>
  );
}
