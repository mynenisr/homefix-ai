import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { classifyIssue, checkSafety, OffTopicError } from '@/lib/claude';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('cases')
    .select('*, user:users(name, email)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { description, address, category, photoUrls = [] } = body;

  // 1. Safety check first (keyword-based, no AI cost)
  const safety = await checkSafety(description);

  // 2. AI triage — throws OffTopicError if not home-repair related
  let triage;
  try {
    triage = await classifyIssue(description, photoUrls[0]);
  } catch (err) {
    if (err instanceof OffTopicError) {
      return NextResponse.json({ error: err.message, offTopic: true }, { status: 422 });
    }
    throw err;
  }

  // 3. Create case
  const { data: newCase, error } = await supabase
    .from('cases')
    .insert({
      user_id: session.user.id,
      description,
      address,
      category: category || triage.category,
      severity: safety.triggers.length > 0 ? 'EMERGENCY' : triage.severity,
      status: safety.triggers.length > 0 ? 'EMERGENCY' : 'TRIAGED',
      diagnosis: triage.diagnosis,
      playbook: triage.playbook,
      safety_flags: safety.triggers,
      confidence: triage.confidence,
      photo_urls: photoUrls,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 4. Add timeline entry
  await supabase.from('case_timeline').insert({
    case_id: newCase.id,
    stage: newCase.status,
    actor: 'AI',
    description: `Issue triaged: ${triage.category} — ${triage.severity}. ${safety.triggers.length > 0 ? 'SAFETY ALERT: ' + safety.triggers.join(', ') : ''}`,
  });

  // 5. If not self-service, set to MATCHING so admin sees it needs a vendor
  if (triage.severity !== 'NORMAL' || !triage.playbook?.length) {
    await supabase.from('cases').update({ status: 'MATCHING' }).eq('id', newCase.id);
    await supabase.from('case_timeline').insert({
      case_id: newCase.id,
      stage: 'MATCHING',
      actor: 'SYSTEM',
      description: 'Case queued for vendor matching. Awaiting admin approval.',
    });
  }

  return NextResponse.json({ id: newCase.id });
}
