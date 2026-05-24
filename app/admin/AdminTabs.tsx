'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin/vendors',    label: '🔧 Vendors' },
  { href: '/admin/users',      label: '👥 Users' },
  { href: '/admin/properties', label: '🏠 Properties' },
];

export default function AdminTabs() {
  const path = usePathname();
  return (
    <div className="flex gap-1 mb-6 border-b border-gray-200">
      {TABS.map(t => {
        const active = path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              active
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
