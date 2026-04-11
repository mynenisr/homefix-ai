import { NextResponse } from 'next/server';
import { createServerClient as _create } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendSMS } from '@/lib/twilio';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/ratelimit';

// Untyped client to avoid Supabase generic inference issues on update
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

  // ── Rate limit: 10 SMS dispatches per hour per admin ────────────────────────
  const smsLimit = await checkRateLimit(`sms:${session.user.id}`, 10, 3600);
  if (!smsLimit.allowed) return rateLimitExceededResponse(smsLimit, 'sms');

  const { vendorId } = await req.json();

  const { data: c } = await supabase.from('cases').select('*').eq('id', params.id).single();
  const { data: vendor } = await supabase.from('vendors').select('*').eq('id', vendorId).single();
  if (!c || !vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase
    .from('cases')
    .update({ vendor_id: vendorId, status: 'SCHEDULED' })
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('case_timeline').insert({
    case_id: params.id,
    stage: 'SCHEDULED',
    actor: 'SYSTEM',
    description: `Vendor ${vendor.name} approved by admin and notified via SMS.`,
  });

  const message = `HomeFix AI: New job assigned.\nCase #${params.id.slice(0, 8)} | ${c.category} — ${c.severity}\n${c.description.slice(0, 120)}\nAddress: ${c.address ?? 'TBD'}\nReply CONFIRM to accept.`;
  await sendSMS(vendor.phone, message);

  return NextResponse.json({ success: true });
}
