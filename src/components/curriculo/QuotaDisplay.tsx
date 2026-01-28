import { Sparkles, Crown, Zap, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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

  const isExhausted = quota.remaining <= 0;

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
    if (percentage <= 0) return 'bg-destructive';
    if (percentage <= 25) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 text-sm",
            isExhausted && "animate-pulse",
            className
          )}>
            {getPlanIcon()}
            <span className={cn(
              "text-muted-foreground",
              isExhausted && "text-destructive"
            )}>
              <span className={cn(
                "font-semibold",
                isExhausted ? "text-destructive" : "text-foreground"
              )}>
                {quota.remaining}
              </span>
              /{quota.monthlyLimit} análises
            </span>
            {/* Mini progress bar */}
            <div className={cn(
              "w-12 h-1.5 rounded-full overflow-hidden",
              isExhausted ? "bg-destructive/20" : "bg-muted"
            )}>
              <div 
                className={cn(
                  "h-full transition-all",
                  isExhausted ? "bg-destructive" : getProgressColor()
                )}
                style={{ width: `${Math.max(5, (quota.remaining / quota.monthlyLimit) * 100)}%` }}
              />
            </div>
            {/* Alert icon when exhausted */}
            {isExhausted && (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          {isExhausted ? (
            <p className="text-destructive font-medium">
              Limite atingido! Faça upgrade para continuar.
            </p>
          ) : (
            <>
              <p className="font-medium">{quota.planName}</p>
              <p className="text-muted-foreground">
                {quota.usedThisMonth} de {quota.monthlyLimit} análises usadas este mês
              </p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
