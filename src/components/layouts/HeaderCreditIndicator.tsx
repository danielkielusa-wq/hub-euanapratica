import { Coins, Crown, Zap, Sparkles, Infinity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderCreditIndicatorProps {
  remaining: number;
  monthlyLimit: number;
  usedThisMonth: number;
  planId: string;
  planName: string;
  isLoading: boolean;
}

export function HeaderCreditIndicator({
  remaining,
  monthlyLimit,
  usedThisMonth,
  planId,
  planName,
  isLoading,
}: HeaderCreditIndicatorProps) {
  const navigate = useNavigate();

  if (isLoading) return null;

  const isUnlimited = monthlyLimit >= 999;
  const isExhausted = remaining <= 0 && !isUnlimited;
  const percentage = isUnlimited ? 100 : Math.round((remaining / monthlyLimit) * 100);

  const getAccentColor = () => {
    if (isUnlimited) return 'text-amber-500';
    if (isExhausted) return 'text-red-500';
    if (percentage <= 25) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getRingColor = () => {
    if (isUnlimited) return 'stroke-amber-400';
    if (isExhausted) return 'stroke-red-500';
    if (percentage <= 25) return 'stroke-amber-500';
    return 'stroke-emerald-500';
  };

  const getBgColor = () => {
    if (isUnlimited) return 'bg-amber-50 dark:bg-amber-500/10';
    if (isExhausted) return 'bg-red-50 dark:bg-red-500/10';
    if (percentage <= 25) return 'bg-amber-50 dark:bg-amber-500/10';
    return 'bg-emerald-50 dark:bg-emerald-500/10';
  };

  const getPlanIcon = () => {
    switch (planId) {
      case 'vip': return <Crown className="w-3.5 h-3.5 text-amber-500" />;
      case 'pro': return <Zap className="w-3.5 h-3.5 text-indigo-500" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  // SVG circular progress
  const size = 28;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate('/pricing')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all',
              'hover:shadow-md cursor-pointer border',
              getBgColor(),
              isExhausted
                ? 'border-red-200 dark:border-red-500/30 animate-pulse'
                : isUnlimited
                  ? 'border-amber-200/60 dark:border-amber-500/20'
                  : 'border-gray-200/60 dark:border-white/10',
            )}
          >
            {/* Mini ring progress */}
            <div className="relative flex items-center justify-center">
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-gray-200 dark:text-white/10"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className={cn('transition-all duration-500', getRingColor())}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {isUnlimited ? (
                  <Infinity className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Coins className={cn('w-3 h-3', getAccentColor())} />
                )}
              </div>
            </div>

            {/* Text */}
            <div className="hidden md:flex flex-col items-start leading-none">
              <span className={cn(
                'text-xs font-bold tabular-nums',
                getAccentColor(),
              )}>
                {isUnlimited ? (
                  <span className="flex items-center gap-0.5">
                    <Infinity className="w-3 h-3 inline" />
                  </span>
                ) : (
                  <>{remaining}<span className="text-gray-400 dark:text-gray-500 font-normal">/{monthlyLimit}</span></>
                )}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">créditos</span>
            </div>

            {/* Mobile: just show number */}
            <span className={cn(
              'md:hidden text-xs font-bold tabular-nums',
              getAccentColor(),
            )}>
              {isUnlimited ? <Infinity className="w-3.5 h-3.5" /> : remaining}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium">
              {getPlanIcon()}
              <span>Plano {planName}</span>
            </div>
            {isUnlimited ? (
              <p className="text-xs text-muted-foreground">
                Créditos ilimitados
              </p>
            ) : isExhausted ? (
              <p className="text-xs text-red-500 font-medium">
                Limite atingido! Clique para fazer upgrade.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {usedThisMonth} de {monthlyLimit} créditos usados este mês
              </p>
            )}
            {/* Mini usage bar in tooltip */}
            {!isUnlimited && (
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isExhausted ? 'bg-red-500' : percentage <= 25 ? 'bg-amber-500' : 'bg-emerald-500',
                  )}
                  style={{ width: `${Math.max(3, percentage)}%` }}
                />
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
