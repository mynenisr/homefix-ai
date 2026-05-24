import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/** Public read — any authenticated user can fetch active properties for the new-case dropdown. */
export async function GET() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerClient();
  const { data, error } = await db
    .from('properties').select('id, name, address, city, state, zip, unit, market')
    .eq('is_active', true)
    .order('market').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
