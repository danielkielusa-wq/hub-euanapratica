import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  tooltip?: string;
  variant?: 'default' | 'warning';
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  onClick, 
  tooltip,
  variant = 'default'
}: StatCardProps) {
  return (
    <Card 
      variant="glass"
      className={cn(
        onClick && "cursor-pointer hover:scale-[1.02]",
        variant === 'warning' && "border-amber-500/30 bg-amber-50/80 dark:bg-amber-900/20"
      )}
      onClick={onClick}
      title={tooltip}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            )}
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}% em relação ao mês anterior
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-2xl",
            variant === 'warning' 
              ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40" 
              : "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              variant === 'warning' ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
