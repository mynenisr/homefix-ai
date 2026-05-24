import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin-guard';

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = createAdminClient();
  const { data, error } = await db.from('users').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
