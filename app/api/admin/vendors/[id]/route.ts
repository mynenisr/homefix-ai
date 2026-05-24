import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin-guard';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const db = createAdminClient();
  const { data, error } = await db.from('vendors').update(body).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
