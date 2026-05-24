import { createServerClient } from './supabase-server';

/** Returns the session if user is ADMIN or PROPERTY_MANAGER, otherwise null. */
export async function requireAdmin() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: u } = await supabase
    .from('users').select('role').eq('id', session.user.id).single();
  if (!u || !['ADMIN', 'PROPERTY_MANAGER'].includes(u.role)) return null;
  return session;
}
