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

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = getClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rating, tags, comment, vendorId } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 });
  }

  // Check no duplicate feedback for this case from this user
  const { data: existing } = await supabase
    .from('feedback')
    .select('id')
    .eq('case_id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Feedback already submitted' }, { status: 409 });
  }

  // Save feedback
  const { error } = await supabase.from('feedback').insert({
    case_id: params.id,
    user_id: session.user.id,
    vendor_id: vendorId ?? null,
    rating,
    tags: tags ?? [],
    comment: comment ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update vendor rating (recalculate average from all feedback)
  if (vendorId) {
    const { data: allFeedback } = await supabase
      .from('feedback')
      .select('rating')
      .eq('vendor_id', vendorId);

    if (allFeedback && allFeedback.length > 0) {
      const avg = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
      await supabase
        .from('vendors')
        .update({
          rating: Math.round(avg * 100) / 100,
          total_jobs: allFeedback.length,
        })
        .eq('id', vendorId);
    }
  }

  // Timeline entry
  await supabase.from('case_timeline').insert({
    case_id: params.id,
    stage: 'COMPLETED',
    actor: 'USER',
    description: `Homeowner left ${rating}-star feedback.${comment ? ' "' + comment.slice(0, 60) + (comment.length > 60 ? '…' : '') + '"' : ''}`,
  });

  return NextResponse.json({ success: true });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('feedback')
    .select('*')
    .eq('case_id', params.id)
    .eq('user_id', session.user.id)
    .single();

  return NextResponse.json({ feedback: data ?? null });
}
