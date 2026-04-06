import type { CaseStatus, Severity, CaseCategory } from './database.types';

// ─── classnames helper ──────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── Date formatting ────────────────────────────────────

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

// ─── Currency formatting ────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// ─── Status colors ──────────────────────────────────────

export function getStatusColor(status: CaseStatus): string {
  const colors: Record<CaseStatus, string> = {
    NEW: 'bg-gray-100 text-gray-700',
    TRIAGED: 'bg-blue-100 text-blue-700',
    SELF_SERVICE: 'bg-teal-100 text-teal-700',
    MATCHING: 'bg-yellow-100 text-yellow-700',
    SCHEDULED: 'bg-purple-100 text-purple-700',
    IN_PROGRESS: 'bg-orange-100 text-orange-700',
    INVOICED: 'bg-indigo-100 text-indigo-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-500',
    EMERGENCY: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

// ─── Severity colors ────────────────────────────────────

export function getSeverityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    EMERGENCY: 'bg-red-100 text-red-700 border-red-300',
    URGENT: 'bg-orange-100 text-orange-700 border-orange-300',
    NORMAL: 'bg-green-100 text-green-700 border-green-300',
  };
  return colors[severity] || 'bg-gray-100 text-gray-700';
}

// ─── Tier colors ────────────────────────────────────────

export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    PROBATIONARY: 'bg-gray-100 text-gray-600',
    ACTIVE: 'bg-green-100 text-green-700',
    PREFERRED: 'bg-blue-100 text-blue-700',
    ELITE: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  };
  return colors[tier] || 'bg-gray-100 text-gray-600';
}

// ─── Category icons ─────────────────────────────────────

export function getCategoryIcon(category: CaseCategory): string {
  const icons: Record<CaseCategory, string> = {
    PLUMBING: '\u{1F6BF}',
    ELECTRICAL: '\u{26A1}',
    HVAC: '\u{2744}\u{FE0F}',
    APPLIANCE: '\u{1F3E0}',
    ROOFING: '\u{1F3D7}\u{FE0F}',
    PEST_CONTROL: '\u{1F41B}',
    LOCKSMITH: '\u{1F511}',
    GENERAL: '\u{1F527}',
  };
  return icons[category] || '\u{1F527}';
}

export function getCategoryLabel(category: CaseCategory): string {
  const labels: Record<CaseCategory, string> = {
    PLUMBING: 'Plumbing',
    ELECTRICAL: 'Electrical',
    HVAC: 'HVAC',
    APPLIANCE: 'Appliance',
    ROOFING: 'Roofing',
    PEST_CONTROL: 'Pest Control',
    LOCKSMITH: 'Locksmith',
    GENERAL: 'General',
  };
  return labels[category] || category;
}
