'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const CATEGORIES = ['PLUMBING','ELECTRICAL','HVAC','APPLIANCE','ROOFING','PEST_CONTROL','LOCKSMITH','GENERAL'];

export default function NewCase() {
  const router = useRouter();
  const [form, setForm] = useState({ description: '', address: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/cases/${id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Submit a New Issue</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Describe the issue *</label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Kitchen faucet has been dripping for 2 days, getting worse..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Property address</label>
            <input
              type="text"
              placeholder="123 Main St, City, State"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category (optional — AI will detect)</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Auto-detect</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing with AI…' : 'Submit & Triage'}
          </button>
        </form>
      </main>
    </>
  );
}
