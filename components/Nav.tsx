'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

interface NavProps {
  role?: string;
}

export default function Nav({ role }: NavProps) {
  const path = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient();
  const isAdmin = role === 'ADMIN' || role === 'PROPERTY_MANAGER';

  const links = [
    { href: '/dashboard', label: isAdmin ? 'All Cases' : 'My Cases' },
    { href: '/cases/new', label: 'New Case' },
    ...(isAdmin ? [{ href: '/admin/vendors', label: 'Vendors' }] : []),
  ];

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-blue-600 mr-4">HomeFix AI</span>
      {links.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm ${path === l.href ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
        >
          {l.label}
        </Link>
      ))}
      <button onClick={signOut} className="ml-auto text-sm text-gray-500 hover:text-gray-900">
        Sign out
      </button>
    </nav>
  );
}
