import { NextResponse } from 'next/server';
import { createServerClient as _create } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getClient() {
  const cookieStore = cookies();
  return _create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  );
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin/PM only
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || !['ADMIN', 'PROPERTY_MANAGER'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('cases')
    .update({ status: 'COMPLETED', resolution_type: 'VENDOR' })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('case_timeline').insert({
    case_id: params.id,
    stage: 'COMPLETED',
    actor: 'SYSTEM',
    description: 'Job marked complete by property manager. Homeowner notified to leave feedback.',
  });

  return NextResponse.json({ success: true });
}
