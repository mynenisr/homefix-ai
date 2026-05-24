'use client';
import { useState, useEffect } from 'react';

const ROLES = ['HOMEOWNER', 'PROPERTY_MANAGER', 'ADMIN'];
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  PROPERTY_MANAGER: 'bg-blue-100 text-blue-700',
  HOMEOWNER: 'bg-gray-100 text-gray-600',
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});

  async function load() {
    const r = await fetch('/api/admin/users');
    setUsers(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function saveRole(userId: string) {
    const role = pending[userId];
    if (!role) return;
    setSaving(userId);
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setSaving(null);
    setPending(p => { const n = { ...p }; delete n[userId]; return n; });
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading users…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Users ({users.length})</h2>
        <p className="text-xs text-gray-500">Change a role then click Save.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {['Name', 'Email', 'Current Role', 'Change Role', 'Joined', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[u.role] ?? ''}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={pending[u.id] ?? u.role}
                    onChange={e => setPending(p => ({ ...p, [u.id]: e.target.value }))}
                    className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {pending[u.id] && pending[u.id] !== u.role && (
                    <button onClick={() => saveRole(u.id)} disabled={saving === u.id}
                      className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {saving === u.id ? 'Saving…' : 'Save'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <p className="text-xs text-amber-800">
          <strong>How onboarding works:</strong> When a PM signs up via magic link, they appear here as HOMEOWNER.
          Change their role to PROPERTY_MANAGER and click Save — they get full admin access immediately on next page load.
        </p>
      </div>
    </div>
  );
}
