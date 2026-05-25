import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/** Returns all cases assigned to the vendor whose email matches the logged-in user. */
export async function GET() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find vendor record by email match
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, name, company, categories, city, state')
    .eq('email', session.user.email!)
    .single();

  if (!vendor) return NextResponse.json({ error: 'No vendor record found for this email' }, { status: 404 });

  const { data: cases, error } = await supabase
    .from('cases')
    .select('*, user:users(name, email, phone)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ vendor, cases });
}
