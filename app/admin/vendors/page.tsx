'use client';
import { useState, useEffect } from 'react';

const CATEGORIES = ['PLUMBING','ELECTRICAL','HVAC','APPLIANCE','ROOFING','PEST_CONTROL','LOCKSMITH','GENERAL'];
const TIERS = ['PROBATIONARY','ACTIVE','PREFERRED','ELITE'];

const EMPTY = {
  name: '', company: '', email: '', phone: '',
  city: '', state: '', zip: '',
  categories: [] as string[], tier: 'ACTIVE',
  service_radius_miles: 25, hourly_rate_min: '', hourly_rate_max: '',
};

function CatCheckboxes({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  function toggle(cat: string) {
    onChange(value.includes(cat) ? value.filter(c => c !== cat) : [...value, cat]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(c => (
        <label key={c} className="flex items-center gap-1 text-xs cursor-pointer select-none">
          <input type="checkbox" checked={value.includes(c)} onChange={() => toggle(c)} />
          {c.replace('_', ' ')}
        </label>
      ))}
    </div>
  );
}

function serviceArea(v: any) {
  const loc = [v.city, v.state].filter(Boolean).join(', ');
  const radius = v.service_radius_miles ? `${v.service_radius_miles} mi` : null;
  if (loc && radius) return `${loc} · ${radius} radius`;
  if (loc) return loc;
  if (radius) return radius;
  return '—';
}

export default function VendorsAdmin() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [error, setError] = useState('');

  async function load() {
    const r = await fetch('/api/admin/vendors');
    setVendors(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addVendor(e: React.FormEvent) {
    e.preventDefault();
    setSaving('new'); setError('');
    const r = await fetch('/api/admin/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        hourly_rate_min: form.hourly_rate_min ? Number(form.hourly_rate_min) : null,
        hourly_rate_max: form.hourly_rate_max ? Number(form.hourly_rate_max) : null,
      }),
    });
    if (!r.ok) { setError((await r.json()).error); setSaving(null); return; }
    setForm({ ...EMPTY }); setShowAdd(false); setSaving(null); load();
  }

  async function saveEdit(id: string) {
    setSaving(id);
    const r = await fetch(`/api/admin/vendors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        hourly_rate_min: editForm.hourly_rate_min ? Number(editForm.hourly_rate_min) : null,
        hourly_rate_max: editForm.hourly_rate_max ? Number(editForm.hourly_rate_max) : null,
      }),
    });
    setSaving(null);
    if (!r.ok) { setError((await r.json()).error); return; }
    setEditId(null); load();
  }

  async function toggleActive(v: any) {
    setSaving(v.id);
    await fetch(`/api/admin/vendors/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !v.is_active }),
    });
    setSaving(null); load();
  }

  const inp = 'w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const sf = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  if (loading) return <p className="text-sm text-gray-500">Loading vendors…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vendors ({vendors.length})</h2>
        <button onClick={() => { setShowAdd(!showAdd); setError(''); }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          {showAdd ? 'Cancel' : '+ Add Vendor'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* ── Add form ─────────────────────────────────────────────────── */}
      {showAdd && (
        <form onSubmit={addVendor} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">New Vendor</p>

          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Full name *" value={form.name} onChange={sf('name')} className={inp} />
            <input placeholder="Company" value={form.company} onChange={sf('company')} className={inp} />
            <input required type="email" placeholder="Email *" value={form.email} onChange={sf('email')} className={inp} />
            <input required placeholder="Phone (+1…)" value={form.phone} onChange={sf('phone')} className={inp} />
          </div>

          {/* Service area */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Service area (home base + radius)</label>
            <div className="grid grid-cols-4 gap-2">
              <input required placeholder="City *" value={form.city} onChange={sf('city')} className={`${inp} col-span-2`} />
              <input required placeholder="State *" value={form.state} onChange={sf('state')} className={inp} />
              <input placeholder="ZIP" value={form.zip} onChange={sf('zip')} className={inp} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Radius (miles)</label>
              <input type="number" value={form.service_radius_miles}
                onChange={e => setForm(f => ({ ...f, service_radius_miles: Number(e.target.value) }))}
                className={`${inp} w-24`} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">Tier</label>
              <select value={form.tier} onChange={sf('tier')} className={inp}>
                {TIERS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Rate min ($/hr)</label>
              <input type="number" value={form.hourly_rate_min}
                onChange={e => setForm(f => ({ ...f, hourly_rate_min: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Rate max ($/hr)</label>
              <input type="number" value={form.hourly_rate_max}
                onChange={e => setForm(f => ({ ...f, hourly_rate_max: e.target.value }))} className={inp} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Categories *</label>
            <CatCheckboxes value={form.categories}
              onChange={v => setForm(f => ({ ...f, categories: v }))} />
          </div>

          <button type="submit" disabled={saving === 'new' || form.categories.length === 0}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving === 'new' ? 'Saving…' : 'Save Vendor'}
          </button>
        </form>
      )}

      {/* ── Vendor list ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {['Name / Company', 'Categories', 'Service Area', 'Rate', 'Rating', 'Active', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vendors.map(v => editId === v.id ? (
              /* ── Inline edit row ── */
              <tr key={v.id} className="bg-yellow-50">
                <td className="px-4 py-3" colSpan={7}>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <input placeholder="Name" value={editForm.name}
                      onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className={inp} />
                    <input placeholder="Company" value={editForm.company ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, company: e.target.value }))} className={inp} />
                    <input placeholder="Email" value={editForm.email}
                      onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value }))} className={inp} />
                    <input placeholder="Phone" value={editForm.phone}
                      onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} className={inp} />
                  </div>
                  {/* Service area row */}
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    <input placeholder="City" value={editForm.city ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, city: e.target.value }))}
                      className={`${inp} col-span-2`} />
                    <input placeholder="State" value={editForm.state ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, state: e.target.value }))} className={inp} />
                    <input placeholder="ZIP" value={editForm.zip ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, zip: e.target.value }))} className={inp} />
                    <input type="number" placeholder="Radius (mi)" value={editForm.service_radius_miles ?? 25}
                      onChange={e => setEditForm((f: any) => ({ ...f, service_radius_miles: Number(e.target.value) }))} className={inp} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <select value={editForm.tier}
                      onChange={e => setEditForm((f: any) => ({ ...f, tier: e.target.value }))} className={inp}>
                      {TIERS.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input type="number" placeholder="Rate min" value={editForm.hourly_rate_min ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, hourly_rate_min: e.target.value }))} className={inp} />
                    <input type="number" placeholder="Rate max" value={editForm.hourly_rate_max ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, hourly_rate_max: e.target.value }))} className={inp} />
                  </div>
                  <CatCheckboxes value={editForm.categories}
                    onChange={cats => setEditForm((f: any) => ({ ...f, categories: cats }))} />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => saveEdit(v.id)} disabled={saving === v.id}
                      className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">
                      {saving === v.id ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </td>
              </tr>
            ) : (
              /* ── Read row ── */
              <tr key={v.id} className={`hover:bg-gray-50 ${!v.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.company || v.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {v.categories.map((c: string) => (
                      <span key={c} className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">
                        {c.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {serviceArea(v)}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {v.hourly_rate_min && v.hourly_rate_max ? `$${v.hourly_rate_min}–$${v.hourly_rate_max}/hr` : '—'}
                </td>
                <td className="px-4 py-3 text-xs">⭐ {Number(v.rating).toFixed(1)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(v)} disabled={saving === v.id}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => { setEditId(v.id); setEditForm({ ...v }); }}
                    className="text-xs text-blue-600 hover:underline">Edit</button>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No vendors yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
