import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: number | string;
  readonly color: 'accent' | 'success' | 'warning' | 'danger';
}

const colorClasses = {
  accent: 'text-accent bg-accent-light',
  success: 'text-success bg-success-light',
  warning: 'text-warning bg-warning-light',
  danger: 'text-danger bg-danger-light',
};

export function StatsCard({ icon: Icon, label, value, color }: Readonly<StatsCardProps>) {
  return (
    <div className="rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight text-text-primary">{value}</p>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">{label}</p>
        </div>
      </div>
    </div>
  );
}
