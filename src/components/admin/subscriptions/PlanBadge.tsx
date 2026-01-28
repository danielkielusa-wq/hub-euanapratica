import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  planId: string;
  planName: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PlanBadge({ planId, planName, size = 'md' }: PlanBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const getVariantClasses = () => {
    switch (planId.toLowerCase()) {
      case 'vip':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'pro':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border',
        sizeClasses[size],
        getVariantClasses()
      )}
    >
      {planName}
    </span>
  );
}
