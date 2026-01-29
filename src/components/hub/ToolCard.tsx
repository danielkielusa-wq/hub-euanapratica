import { Link } from 'react-router-dom';
import { LucideIcon, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
  hasAccess: boolean;
  planBadge?: 'pro' | 'vip' | null;
  isNew?: boolean;
  isBeta?: boolean;
  onUpgradeClick?: () => void;
}

const planBadges = {
  pro: { label: 'PRO', className: 'bg-slate-200 text-slate-700' },
  vip: { label: 'VIP', className: 'bg-amber-100 text-amber-700' },
};

export function ToolCard({
  title,
  description,
  icon: Icon,
  route,
  hasAccess,
  planBadge,
  isNew,
  isBeta,
  onUpgradeClick,
}: ToolCardProps) {
  const content = (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-[32px] border bg-card p-6 transition-all duration-300',
        hasAccess && 'hover:-translate-y-1 hover:shadow-2xl hover:border-primary/30 cursor-pointer',
        !hasAccess && 'opacity-80'
      )}
    >
      {/* Badges */}
      <div className="absolute -right-2 -top-2 flex gap-1">
        {isNew && (
          <Badge className="bg-primary text-primary-foreground shadow-md">NOVO</Badge>
        )}
        {isBeta && (
          <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700 shadow-md">
            BETA
          </Badge>
        )}
      </div>

      {/* Icon */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
        <Icon className="h-7 w-7 text-primary" />
      </div>

      {/* Title with Plan Badge */}
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
        {planBadge && (
          <Badge className={cn('text-[10px]', planBadges[planBadge].className)}>
            {planBadges[planBadge].label}
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>

      {/* CTA */}
      {hasAccess ? (
        <div className="flex items-center text-sm font-medium text-primary group-hover:underline">
          Acessar agora
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2 rounded-xl"
          onClick={(e) => {
            e.preventDefault();
            onUpgradeClick?.();
          }}
        >
          <Lock className="h-4 w-4" />
          Desbloquear
        </Button>
      )}
    </div>
  );

  if (hasAccess) {
    return <Link to={route}>{content}</Link>;
  }

  return content;
}
