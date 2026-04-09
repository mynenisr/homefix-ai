import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import Nav from '@/components/Nav';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import type { Case } from '@/lib/database.types';

export default async function Dashboard() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // Get role from DB (source of truth)
  const { data: profile } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', session.user.id)
    .single();

  const role = profile?.role ?? 'HOMEOWNER';
  const isAdmin = role === 'ADMIN' || role === 'PROPERTY_MANAGER';

  // Admins see all cases; homeowners see only their own
  const query = supabase
    .from('cases')
    .select('*, user:users(name, email)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!isAdmin) query.eq('user_id', session.user.id);

  const { data: cases } = await query;

  const stats = {
    total: cases?.length ?? 0,
    emergency: cases?.filter(c => c.severity === 'EMERGENCY').length ?? 0,
    open: cases?.filter(c => !['COMPLETED', 'CLOSED'].includes(c.status)).length ?? 0,
    matching: cases?.filter(c => c.status === 'MATCHING').length ?? 0,
  };

  return (
    <>
      <Nav role={role} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">
              {isAdmin ? 'All Cases' : 'My Cases'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isAdmin ? `Property Manager · ${profile?.name ?? ''}` : `Homeowner · ${profile?.name ?? ''}`}
            </p>
          </div>
          <Link href="/cases/new" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
            + New Case
          </Link>
        </div>

        {/* Stats — admin only */}
        {isAdmin && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Cases', value: stats.total },
              { label: 'Open', value: stats.open, color: 'text-blue-600' },
              { label: 'Awaiting Vendor', value: stats.matching, color: 'text-purple-600' },
              { label: 'Emergency', value: stats.emergency, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color ?? 'text-gray-900'}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Cases table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {[
                  'Case',
                  ...(isAdmin ? ['Submitted by'] : []),
                  'Category', 'Severity', 'Status', 'Date'
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(cases as Case[])?.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/cases/${c.id}`} className="text-blue-600 hover:underline font-medium">
                      #{c.id.slice(0, 8)}
                    </Link>
                    <p className="text-gray-500 text-xs truncate max-w-[180px]">{c.description}</p>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-gray-600">{(c as any).user?.name ?? '—'}</td>
                  )}
                  <td className="px-4 py-3 text-gray-600">{c.category}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={c.severity} /></td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!cases?.length && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                    {isAdmin ? 'No cases yet.' : 'You have no cases yet. Submit your first issue above.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
