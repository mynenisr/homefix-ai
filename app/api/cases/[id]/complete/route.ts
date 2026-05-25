import { NextResponse } from 'next/server';
import { createServerClient as _create } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { emailCaseCompleted } from '@/lib/email';

function getClient() {
  const cookieStore = cookies();
  return _create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  );
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = getClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', session.user.id).single();

  if (!profile || !['ADMIN', 'PROPERTY_MANAGER'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { invoice_amount, invoice_notes } = body;

  const update: Record<string, any> = {
    status: 'COMPLETED',
    resolution_type: 'VENDOR',
  };
  if (invoice_amount != null) update.invoice_amount = invoice_amount;
  if (invoice_notes)          update.invoice_notes  = invoice_notes;

  const { error } = await supabase.from('cases').update(update).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const amountStr = invoice_amount ? ` · Invoice: $${Number(invoice_amount).toFixed(2)}` : '';
  await supabase.from('case_timeline').insert({
    case_id: params.id,
    stage: 'COMPLETED',
    actor: 'SYSTEM',
    description: `Job marked complete by property manager.${amountStr} Homeowner notified to leave feedback.`,
  });

  // Email homeowner that job is done (fire-and-forget)
  const { data: caseRow } = await supabase
    .from('cases').select('category, user_id').eq('id', params.id).single();
  if (caseRow) {
    const { data: homeowner } = await supabase
      .from('users').select('email').eq('id', caseRow.user_id).single();
    if (homeowner?.email) {
      emailCaseCompleted(homeowner.email, params.id, caseRow.category, invoice_amount ?? undefined);
    }
  }

  return NextResponse.json({ success: true });
}
