import { getNextLevelProgress, getLevelTitle } from '@/types/community';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserLevelBadgeProps {
  level: number;
  totalPoints: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  variant?: 'default' | 'pill';
  initials?: string;
  className?: string;
}

export function UserLevelBadge({
  level,
  totalPoints,
  size = 'md',
  showProgress = true,
  variant = 'default',
  initials = '?',
  className
}: UserLevelBadgeProps) {
  const progress = getNextLevelProgress(totalPoints, level);
  const title = getLevelTitle(level);

  if (variant === 'pill') {
    return (
      <div className={cn(
        'bg-white p-1.5 pl-4 pr-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-3',
        className
      )}>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase text-gray-400">
            Nivel {level}
          </span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
          {initials}
        </div>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const badgeColors = {
    1: 'bg-gray-100 text-gray-600 border-gray-200',
    2: 'bg-green-100 text-green-700 border-green-200',
    3: 'bg-blue-100 text-blue-700 border-blue-200',
    4: 'bg-purple-100 text-purple-700 border-purple-200',
    5: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'rounded-full flex items-center justify-center font-bold border-2',
        sizeClasses[size],
        badgeColors[level as keyof typeof badgeColors] || badgeColors[1]
      )}>
        {level}
      </div>

      {showProgress && (
        <div className="flex-1 min-w-[80px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-muted-foreground">{title}</span>
            <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
              <Zap className="h-3 w-3" />
              {totalPoints} XP
            </span>
          </div>
          <Progress value={progress.percent} className="h-1.5" />
          {level < 5 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {progress.next - totalPoints} XP para nivel {level + 1}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
