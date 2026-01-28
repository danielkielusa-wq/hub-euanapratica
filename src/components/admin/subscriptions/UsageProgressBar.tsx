import { cn } from '@/lib/utils';

interface UsageProgressBarProps {
  used: number;
  limit: number;
  variant?: 'curriculo' | 'jobs';
  className?: string;
}

export function UsageProgressBar({ 
  used, 
  limit, 
  variant = 'curriculo',
  className 
}: UsageProgressBarProps) {
  const isUnlimited = limit === 999;
  const percentage = isUnlimited 
    ? Math.min((used / 100) * 100, 100)
    : limit > 0 
      ? Math.min((used / limit) * 100, 100) 
      : 0;

  const barColor = variant === 'curriculo' 
    ? 'bg-blue-600' 
    : 'bg-emerald-500';

  return (
    <div className={cn('w-full', className)}>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
