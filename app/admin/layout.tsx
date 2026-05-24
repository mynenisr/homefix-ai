import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import Nav from '@/components/Nav';
import AdminTabs from './AdminTabs';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', session.user.id).single();

  if (!profile || !['ADMIN', 'PROPERTY_MANAGER'].includes(profile.role)) {
    redirect('/dashboard');
  }

  return (
    <>
      <Nav role={profile.role} />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <AdminTabs />
        {children}
      </main>
    </>
  );
}
