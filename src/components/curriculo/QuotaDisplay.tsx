import { Sparkles, Crown, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuotaDisplayProps {
  className?: string;
}

export function QuotaDisplay({ className = '' }: QuotaDisplayProps) {
  const { quota, isLoading } = useSubscription();

  if (isLoading) {
    return <Skeleton className={`h-6 w-32 ${className}`} />;
  }

  if (!quota) {
    return null;
  }

  const getPlanIcon = () => {
    switch (quota.planId) {
      case 'vip':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'pro':
        return <Zap className="w-4 h-4 text-indigo-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-gray-400" />;
    }
  };

  const getProgressColor = () => {
    const percentage = (quota.remaining / quota.monthlyLimit) * 100;
    if (percentage <= 0) return 'bg-red-500';
    if (percentage <= 25) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 text-sm ${className}`}>
            {getPlanIcon()}
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{quota.remaining}</span>
              /{quota.monthlyLimit} análises
            </span>
            {/* Mini progress bar */}
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${getProgressColor()}`}
                style={{ width: `${Math.max(0, (quota.remaining / quota.monthlyLimit) * 100)}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          <p className="font-medium">{quota.planName}</p>
          <p className="text-muted-foreground">
            {quota.usedThisMonth} de {quota.monthlyLimit} análises usadas este mês
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
