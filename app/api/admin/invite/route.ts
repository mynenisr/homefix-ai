import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin-guard';
import { emailInvite } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://homefix-ai.vercel.app';

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email, inviterName } = await req.json();
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Generate an invite link — creates the auth user if they don't exist yet,
  // returns a one-time magic link we send in our own branded email.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: email.trim().toLowerCase(),
    options: { redirectTo: `${APP_URL}/auth/callback` },
  });

  if (error) {
    console.error('[HomeFix Invite] generateLink error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const inviteLink = data.properties.action_link;
  await emailInvite(email, inviteLink, inviterName);

  return NextResponse.json({ success: true });
}
