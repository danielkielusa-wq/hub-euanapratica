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
  Brain,
  Briefcase,
  BookOpen,
  Mic,
  Video,
  Users,
  Rocket,
  Target,
  TrendingUp,
  Zap,
  Crown,
  Star,
  Heart,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HubService, SERVICE_TYPE_LABELS, ServiceType } from '@/types/hub';

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
  Sparkles,
  Brain,
  Briefcase,
  BookOpen,
  Mic,
  Video,
  Users,
  Rocket,
  Target,
  TrendingUp,
  Zap,
  Crown,
  Star,
  Heart,
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

const serviceTypeConfig: Record<ServiceType, { color: string }> = {
  ai_tool: { color: 'bg-primary/10 text-primary' },
  live_mentoring: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  recorded_course: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  consulting: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
};

export function HubServiceCard({ service, hasAccess }: HubServiceCardProps) {
  const Icon = iconMap[service.icon_name] || FileCheck;
  const config = statusConfig[service.status] || statusConfig.available;
  const isLocked = service.status === 'premium' && !hasAccess;
  const isComingSoon = service.status === 'coming_soon';
  const serviceType = (service.service_type as ServiceType) || 'ai_tool';
  const typeConf = serviceTypeConfig[serviceType] || serviceTypeConfig.ai_tool;

  const formatPrice = (price: number, currency: string) => {
    if (!price || price === 0) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(price);
  };

  const displayPrice = service.price_display || formatPrice(service.price, service.currency);

  const handleUnlock = () => {
    // If there's a Stripe price ID, this would trigger Stripe Checkout
    // For now, redirect to a contact or sales page
    if (service.stripe_price_id) {
      // TODO: Implement Stripe Checkout when enabled
      console.log('Stripe checkout for:', service.stripe_price_id);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-[32px] border bg-card p-6 transition-all duration-300',
        service.is_highlighted
          ? 'border-primary/30 shadow-lg shadow-primary/5'
          : 'border-border/50 hover:border-border',
        !isComingSoon && 'hover:-translate-y-1 hover:shadow-lg',
        isComingSoon && 'opacity-70'
      )}
    >
      {/* Ribbon Badge */}
      {service.ribbon && (
        <div className="absolute -right-2 -top-2">
          <Badge 
            className={cn(
              'rounded-full px-3 py-1 text-[10px] font-bold shadow-md',
              service.ribbon === 'POPULAR' && 'bg-secondary text-secondary-foreground',
              service.ribbon === 'NOVO' && 'bg-primary text-primary-foreground',
              service.ribbon === 'EXCLUSIVO' && 'bg-accent text-accent-foreground'
            )}
          >
            {service.ribbon}
          </Badge>
        </div>
      )}

      {/* Status & Type Badges */}
      <div className="mb-4 flex items-center justify-between">
        <Badge variant="outline" className={cn('text-[10px] font-medium', typeConf.color)}>
          {SERVICE_TYPE_LABELS[serviceType]}
        </Badge>
        <Badge variant="outline" className={cn('text-[10px] font-semibold', config.badgeClass)}>
          {config.badge}
        </Badge>
      </div>

      {/* Category */}
      {service.category && (
        <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
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
      <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {service.description}
      </p>

      {/* Price Display */}
      {displayPrice && (
        <p className="mb-4 text-sm font-semibold text-foreground">{displayPrice}</p>
      )}

      {/* Action Button */}
      <div className="mt-auto">
        {isComingSoon ? (
          <Button variant="outline" disabled className="w-full rounded-xl">
            Em Breve
          </Button>
        ) : isLocked ? (
          <Button 
            variant="outline" 
            className="w-full rounded-xl border-2 border-primary text-primary hover:bg-primary/5"
            onClick={handleUnlock}
          >
            <Lock className="mr-2 h-4 w-4" />
            Desbloquear Acesso
          </Button>
        ) : service.route ? (
          <Link to={service.redirect_url || service.route}>
            <Button
              className={cn(
                'w-full rounded-xl',
                service.is_highlighted
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-foreground text-background hover:bg-foreground/90'
              )}
            >
              {service.cta_text || 'Acessar Agora'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button 
            variant="outline" 
            className="w-full rounded-xl"
            onClick={handleUnlock}
          >
            {service.cta_text || 'Ver Detalhes'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
