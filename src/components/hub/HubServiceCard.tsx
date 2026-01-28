import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  FileCheck,
  Award,
  Monitor,
  Globe,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HubService } from '@/hooks/useHubServices';

interface HubServiceCardProps {
  service: HubService;
  hasAccess: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  GraduationCap,
  FileCheck,
  Award,
  Monitor,
  Globe,
  Building2,
};

const statusConfig = {
  available: {
    badge: 'DISPONÍVEL',
    badgeClass: 'bg-accent/10 text-accent border-accent/20',
  },
  premium: {
    badge: 'PREMIUM',
    badgeClass: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  coming_soon: {
    badge: 'EM BREVE',
    badgeClass: 'bg-muted text-muted-foreground border-muted',
  },
};

export function HubServiceCard({ service, hasAccess }: HubServiceCardProps) {
  const Icon = iconMap[service.icon_name] || FileCheck;
  const config = statusConfig[service.status];
  const isLocked = service.status === 'premium' && !hasAccess;
  const isComingSoon = service.status === 'coming_soon';

  return (
    <div
      className={cn(
        'group relative rounded-[32px] border bg-card p-6 transition-all duration-300',
        service.is_highlighted
          ? 'border-primary/30 shadow-lg shadow-primary/5'
          : 'border-border/50 hover:border-border',
        !isComingSoon && 'hover:-translate-y-1 hover:shadow-lg',
        isComingSoon && 'opacity-70'
      )}
    >
      {/* Status Badge */}
      <div className="absolute right-4 top-4">
        <Badge variant="outline" className={cn('text-[10px] font-semibold', config.badgeClass)}>
          {config.badge}
        </Badge>
      </div>

      {/* Category */}
      {service.category && (
        <span className="mb-3 inline-block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {service.category}
        </span>
      )}

      {/* Icon */}
      <div
        className={cn(
          'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
          service.is_highlighted ? 'bg-primary/10' : 'bg-muted'
        )}
      >
        <Icon
          className={cn('h-7 w-7', service.is_highlighted ? 'text-primary' : 'text-foreground')}
        />
      </div>

      {/* Title */}
      <h3 className="mb-2 flex items-center gap-2 text-xl font-semibold text-foreground">
        {service.name}
        {service.is_highlighted && <Sparkles className="h-4 w-4 text-primary" />}
      </h3>

      {/* Description */}
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{service.description}</p>

      {/* Price Display */}
      {service.price_display && (
        <p className="mb-4 text-xs font-medium text-muted-foreground">{service.price_display}</p>
      )}

      {/* Action Button */}
      {isComingSoon ? (
        <Button variant="outline" disabled className="w-full rounded-xl">
          Em Breve
        </Button>
      ) : isLocked ? (
        <Button variant="outline" className="w-full rounded-xl">
          <Lock className="mr-2 h-4 w-4" />
          Upgrade para Acessar
        </Button>
      ) : service.route ? (
        <Link to={service.route}>
          <Button
            className={cn(
              'w-full rounded-xl',
              service.is_highlighted
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-foreground text-background hover:bg-foreground/90'
            )}
          >
            Acessar Agora
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" className="w-full rounded-xl">
          Ver Detalhes
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
