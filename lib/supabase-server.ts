import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server components & route handlers
export function createServerClient() {
  const cookieStore = cookies();
  return _createServerClient<Database>(url, anonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
    },
  });
}

// Admin — bypasses RLS
export function createAdminClient() {
  const cookieStore = cookies();
  return _createServerClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
    },
    auth: { persistSession: false },
  });
}
