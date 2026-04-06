'use client';
import { createBrowserClient as _createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client components only (untyped for MVP flexibility)
export function createBrowserClient() {
  return _createBrowserClient(url, anonKey);
}
