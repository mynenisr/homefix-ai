import type { CaseStatus, Severity } from '@/lib/database.types';

const statusColors: Record<CaseStatus, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  TRIAGED: 'bg-blue-100 text-blue-700',
  SELF_SERVICE: 'bg-yellow-100 text-yellow-700',
  MATCHING: 'bg-purple-100 text-purple-700',
  SCHEDULED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  INVOICED: 'bg-pink-100 text-pink-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-200 text-gray-600',
  EMERGENCY: 'bg-red-100 text-red-700',
};

const severityColors: Record<Severity, string> = {
  EMERGENCY: 'bg-red-500 text-white',
  URGENT: 'bg-orange-400 text-white',
  NORMAL: 'bg-gray-200 text-gray-700',
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityColors[severity]}`}>
      {severity}
    </span>
  );
}
