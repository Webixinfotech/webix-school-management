import { CheckCircle2, Clock3, Trash2, XCircle } from 'lucide-react';

const STATUS_STYLES = {
  pending: {
    label: 'Pending',
    icon: Clock3,
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  deleted: {
    label: 'Deleted',
    icon: Trash2,
    className: 'border-slate-300 bg-slate-100 text-slate-700',
  },
};

export default function PhotoStatusBadge({ status, deleted = false }) {
  const config = deleted ? STATUS_STYLES.deleted : STATUS_STYLES[status] || STATUS_STYLES.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}
