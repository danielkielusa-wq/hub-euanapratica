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
      className={cn(
        "transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/30",
        variant === 'warning' && "border-orange-500/30 bg-orange-500/5"
      )}
      onClick={onClick}
      title={tooltip}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-primary" : "text-destructive"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}% em relação ao mês anterior
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            variant === 'warning' ? "bg-orange-500/10" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              variant === 'warning' ? "text-orange-500" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
