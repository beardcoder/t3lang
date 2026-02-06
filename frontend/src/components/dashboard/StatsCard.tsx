import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color: 'accent' | 'success' | 'warning' | 'danger';
}

const colorClasses = {
  accent: 'text-accent bg-accent-light',
  success: 'text-success bg-success-light',
  warning: 'text-warning bg-warning-light',
  danger: 'text-danger bg-danger-light',
};

export function StatsCard({ icon: Icon, label, value, color }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-text-primary">{value}</p>
          <p className="text-xs text-text-tertiary">{label}</p>
        </div>
      </div>
    </div>
  );
}
