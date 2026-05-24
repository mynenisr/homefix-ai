import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin-guard';

const VALID_ROLES = ['HOMEOWNER', 'PROPERTY_MANAGER', 'ADMIN'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { role, name } = await req.json();
  if (role && !VALID_ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  const update: Record<string, string> = {};
  if (role) update.role = role;
  if (name) update.name = name;
  const db = createAdminClient();
  const { data, error } = await db.from('users').update(update).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
