import { getNextLevelProgress, getLevelTitle } from '@/types/community';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserLevelBadgeProps {
  level: number;
  totalPoints: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

export function UserLevelBadge({ 
  level, 
  totalPoints, 
  size = 'md',
  showProgress = true,
  className 
}: UserLevelBadgeProps) {
  const progress = getNextLevelProgress(totalPoints, level);
  const title = getLevelTitle(level);

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
              {progress.next - totalPoints} XP para nível {level + 1}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
