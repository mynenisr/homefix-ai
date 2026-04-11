import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// ─── Service-role client (bypasses RLS — server-side only) ──────────────────
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('[RateLimit] Missing Supabase service role config');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  limit: number;
}

// ─── Core rate limit check ───────────────────────────────────────────────────
// Fixed-window counter stored in Supabase.
// Works across Vercel serverless invocations — no shared memory needed.
//
// key          — unique identifier, e.g. "triage:user-uuid" or "sms:admin-uuid"
// limit        — max requests allowed in the window
// windowSeconds — window size in seconds
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const db = getAdminClient();
  const now = new Date();
  const windowCutoff = new Date(now.getTime() - windowSeconds * 1000);

  try {
    const { data } = await db
      .from('rate_limits')
      .select('count, window_start')
      .eq('key', key)
      .single();

    // No record yet, or window expired — start fresh
    if (!data || new Date(data.window_start) < windowCutoff) {
      await db.from('rate_limits').upsert({
        key,
        count: 1,
        window_start: now.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: 'key' });
      return { allowed: true, remaining: limit - 1, resetInSeconds: windowSeconds, limit };
    }

    // Within window and over limit
    if (data.count >= limit) {
      const windowExpiry = new Date(new Date(data.window_start).getTime() + windowSeconds * 1000);
      const resetInSeconds = Math.max(1, Math.ceil((windowExpiry.getTime() - now.getTime()) / 1000));
      return { allowed: false, remaining: 0, resetInSeconds, limit };
    }

    // Within window and under limit — increment
    await db.from('rate_limits')
      .update({ count: data.count + 1, updated_at: now.toISOString() })
      .eq('key', key);

    return { allowed: true, remaining: limit - data.count - 1, resetInSeconds: windowSeconds, limit };

  } catch (err) {
    // On any DB error, fail open (allow the request) but log it
    console.error('[RateLimit] DB error — failing open:', err);
    return { allowed: true, remaining: 1, resetInSeconds: windowSeconds, limit };
  }
}

// ─── Response helper ─────────────────────────────────────────────────────────
// Returns a ready-to-return NextResponse when rate limit is exceeded.
export function rateLimitExceededResponse(result: RateLimitResult, type: string): NextResponse {
  const minutes = Math.ceil(result.resetInSeconds / 60);
  const timeStr = result.resetInSeconds < 60
    ? `${result.resetInSeconds} seconds`
    : `${minutes} minute${minutes > 1 ? 's' : ''}`;

  const messages: Record<string, string> = {
    triage: `Too many submissions. You've reached the limit of ${result.limit} repair requests per 10 minutes. Please wait ${timeStr} before submitting again.`,
    sms:    `Too many dispatch approvals. SMS limit of ${result.limit} per hour reached. Please wait ${timeStr} to prevent SMS abuse.`,
  };

  return NextResponse.json(
    {
      error: messages[type] ?? `Rate limit exceeded. Try again in ${timeStr}.`,
      rateLimited: true,
      resetInSeconds: result.resetInSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.resetInSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + result.resetInSeconds),
      },
    }
  );
}
