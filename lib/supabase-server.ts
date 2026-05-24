import { createServerClient as _createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server components & route handlers — uses user session cookie, subject to RLS
export function createServerClient() {
  const cookieStore = cookies();
  return _createServerClient(url, anonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
    },
  });
}

// Service-role client — bypasses RLS entirely. Use only in admin API routes.
export function createAdminClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
