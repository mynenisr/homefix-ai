import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server components & route handlers (untyped for MVP flexibility)
export function createServerClient() {
  const cookieStore = cookies();
  return _createServerClient(url, anonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
    },
  });
}

export function createAdminClient() {
  const cookieStore = cookies();
  return _createServerClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
    },
    auth: { persistSession: false },
  });
}
