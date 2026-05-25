import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

const VENDOR_ALLOWED_STATUSES = ['IN_PROGRESS', 'COMPLETED'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify this vendor owns this case
  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('email', session.user.email!).single();
  if (!vendor) return NextResponse.json({ error: 'Not a vendor' }, { status: 403 });

  const { data: c } = await supabase
    .from('cases').select('vendor_id').eq('id', params.id).single();
  if (!c || c.vendor_id !== vendor.id)
    return NextResponse.json({ error: 'Not your case' }, { status: 403 });

  const { status, vendor_notes } = await req.json();

  if (status && !VENDOR_ALLOWED_STATUSES.includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const update: Record<string, any> = {};
  if (status)       update.status       = status;
  if (vendor_notes !== undefined) update.vendor_notes = vendor_notes;

  const { error } = await supabase.from('cases').update(update).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status) {
    await supabase.from('case_timeline').insert({
      case_id: params.id,
      stage: status,
      actor: 'VENDOR',
      description: status === 'IN_PROGRESS'
        ? 'Vendor confirmed — on the way.'
        : 'Vendor marked job complete. Awaiting PM confirmation.',
    });
  }

  return NextResponse.json({ success: true });
}
