import { LucideIcon } from 'lucide-react';
import { UsageProgressBar } from './UsageProgressBar';
import { cn } from '@/lib/utils';

interface AppConsumptionCardProps {
  icon: LucideIcon;
  appName: string;
  used: number;
  limit: number;
  label: string;
  variant?: 'curriculo' | 'jobs';
}

export function AppConsumptionCard({
  icon: Icon,
  appName,
  used,
  limit,
  label,
  variant = 'curriculo',
}: AppConsumptionCardProps) {
  const isUnlimited = limit === 999;
  const iconColor = variant === 'curriculo' ? 'text-blue-600' : 'text-emerald-500';

  return (
    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('w-5 h-5', iconColor)} />
        <span className="font-medium text-slate-900">{appName}</span>
      </div>
      
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900">{used}</span>
          <span className="text-lg text-slate-400">
            / {isUnlimited ? '∞' : limit}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
      </div>

      <UsageProgressBar used={used} limit={limit} variant={variant} />
    </div>
  );
}
