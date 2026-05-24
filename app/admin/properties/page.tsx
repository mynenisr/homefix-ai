'use client';
import { useState, useEffect } from 'react';

const MARKETS = ['MERCED', 'UIUC', 'OTHER'];
const EMPTY = { name: '', address: '', city: '', state: '', zip: '', unit: '', market: 'MERCED', notes: '' };

export default function PropertiesAdmin() {
  const [props, setProps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState('');

  async function load() {
    const r = await fetch('/api/admin/properties');
    setProps(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function addProperty(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const r = await fetch('/api/admin/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!r.ok) { setError((await r.json()).error); setSaving(false); return; }
    setForm({ ...EMPTY });
    setShowAdd(false);
    setSaving(false);
    load();
  }

  async function toggleActive(p: any) {
    await fetch(`/api/admin/properties/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    load();
  }

  const inputCls = 'w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const byMarket = MARKETS.map(m => ({ market: m, items: props.filter(p => p.market === m) }))
    .filter(g => g.items.length > 0);
  const other = props.filter(p => !MARKETS.includes(p.market));

  if (loading) return <p className="text-sm text-gray-500">Loading properties…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Properties ({props.length})</h2>
        <button onClick={() => { setShowAdd(!showAdd); setError(''); }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          {showAdd ? 'Cancel' : '+ Add Property'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addProperty} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">New Property</p>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Property name (e.g. Merced Unit 4A) *" value={form.name}
              onChange={e => set('name', e.target.value)} className={`${inputCls} col-span-2`} />
            <input required placeholder="Street address *" value={form.address}
              onChange={e => set('address', e.target.value)} className={inputCls} />
            <input placeholder="Unit / Apt" value={form.unit}
              onChange={e => set('unit', e.target.value)} className={inputCls} />
            <input required placeholder="City *" value={form.city}
              onChange={e => set('city', e.target.value)} className={inputCls} />
            <input required placeholder="State (e.g. CA) *" value={form.state}
              onChange={e => set('state', e.target.value)} className={inputCls} />
            <input placeholder="ZIP" value={form.zip}
              onChange={e => set('zip', e.target.value)} className={inputCls} />
            <div>
              <label className="text-xs text-gray-500">Market</label>
              <select value={form.market} onChange={e => set('market', e.target.value)} className={inputCls}>
                {MARKETS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <input placeholder="Notes (optional)" value={form.notes}
              onChange={e => set('notes', e.target.value)} className={inputCls} />
          </div>
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Property'}
          </button>
        </form>
      )}

      {/* Property list grouped by market */}
      {[...byMarket, ...(other.length ? [{ market: 'OTHER', items: other }] : [])].map(group => (
        <div key={group.market} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{group.market}</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {group.items.map((p: any) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.address}{p.unit ? `, Unit ${p.unit}` : ''} · {p.city}, {p.state} {p.zip}
                    </p>
                    {p.notes && <p className="text-xs text-gray-400 mt-0.5">{p.notes}</p>}
                  </td>
                  <td className="px-4 py-3 w-24">
                    <button onClick={() => toggleActive(p)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {props.length === 0 && !showAdd && (
        <div className="bg-white rounded-xl shadow-sm px-4 py-12 text-center text-gray-400">
          No properties yet. Add your Merced and UIUC properties above.
        </div>
      )}
    </div>
  );
}
