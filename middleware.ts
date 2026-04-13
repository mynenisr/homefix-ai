import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          req.cookies.set({ name, value: '', ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  // Always allow — auth callback, Next.js internals, and PWA static assets
  if (
    path.startsWith('/auth/callback') ||
    path.startsWith('/_next') ||
    path.startsWith('/icons/') ||
    path === '/sw.js' ||
    path === '/manifest.json' ||
    path === '/favicon.ico'
  ) {
    return res;
  }

  // Unauthenticated → login
  if (!session) {
    if (path.startsWith('/login')) return res;
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Authenticated on login page → dashboard
  if (path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Store role in header so server components can read it without extra DB call
  const role = session.user.user_metadata?.role ?? 'HOMEOWNER';
  res.headers.set('x-user-role', role);
  res.headers.set('x-user-id', session.user.id);

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json|api/).*)'],
};
