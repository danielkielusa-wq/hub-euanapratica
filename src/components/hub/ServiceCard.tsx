import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, LucideIcon } from 'lucide-react';
import * as icons from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HubService, SERVICE_TYPE_LABELS, ServiceType } from '@/types/hub';
import { PriceDisplay } from './PriceDisplay';

interface ServiceCardProps {
  service: HubService;
  hasAccess: boolean;
}

const serviceTypeColors: Record<ServiceType, string> = {
  ai_tool: 'bg-primary/10 text-primary',
  live_mentoring: 'bg-green-100 text-green-700',
  recorded_course: 'bg-purple-100 text-purple-700',
  consulting: 'bg-orange-100 text-orange-700',
};

export function ServiceCard({ service, hasAccess }: ServiceCardProps) {
  const navigate = useNavigate();

  // Get icon component safely
  const iconName = service.icon_name as keyof typeof icons;
  const Icon = (icons[iconName] as LucideIcon) || icons.FileCheck;

  const serviceType = (service.service_type as ServiceType) || 'consulting';
  const typeColor = serviceTypeColors[serviceType] || serviceTypeColors.consulting;

  const getInternalPath = (url: string): string | null => {
    if (url.startsWith('/')) return url;
    try {
      const parsed = new URL(url);
      if (parsed.origin === window.location.origin) return parsed.pathname;
    } catch {}
    return null;
  };

  // Catalog = showcase → always navigate to the landing page
  const getLandingPageUrl = (): string => {
    if (service.landing_page_url) {
      const internal = getInternalPath(service.landing_page_url);
      if (internal) return internal;
    }
    // Fallback: dynamic service detail page (always exists)
    return `/servicos/${service.id}`;
  };

  const handleNavigate = () => {
    navigate(getLandingPageUrl());
  };

  const isComingSoon = service.status === 'coming_soon';
  const canAccess = service.status === 'available' || hasAccess;

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-[32px] border bg-card p-6 transition-all duration-300',
        !isComingSoon && canAccess && 'hover:-translate-y-1 hover:shadow-xl hover:border-primary/30',
        isComingSoon && 'opacity-70'
      )}
    >
      {/* Ribbon */}
      {service.ribbon && (
        <div className="absolute -right-2 -top-2">
          <Badge 
            className={cn(
              'rounded-full px-3 py-1 text-[10px] font-bold shadow-md',
              service.ribbon === 'POPULAR' && 'bg-secondary text-secondary-foreground',
              service.ribbon === 'NOVO' && 'bg-primary text-primary-foreground',
              service.ribbon === 'EXCLUSIVO' && 'bg-amber-500 text-white'
            )}
          >
            {service.ribbon}
          </Badge>
        </div>
      )}

      {/* Type Badge */}
      <div className="mb-4">
        <Badge variant="outline" className={cn('text-[10px] font-medium', typeColor)}>
          {SERVICE_TYPE_LABELS[serviceType]}
        </Badge>
      </div>

      {/* Category */}
      {service.category && (
        <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {service.category}
        </span>
      )}

      {/* Icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-6 w-6 text-foreground" />
      </div>

      {/* Title */}
      <h3 className="mb-2 font-semibold text-lg text-foreground">{service.name}</h3>

      {/* Description */}
      <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">
        {service.description}
      </p>

      {/* Price */}
      {service.price && service.price > 0 && (
        <PriceDisplay
          price={service.price}
          priceDisplay={service.price_display}
          anchorPrice={service.anchor_price}
          size="md"
          className="mb-4"
        />
      )}

      {/* Action — catalog is a showcase, always go to landing page */}
      <div className="mt-auto">
        {isComingSoon ? (
          <Button variant="outline" disabled className="w-full rounded-xl">
            Em Breve
          </Button>
        ) : (
          <Button
            variant={canAccess ? 'default' : 'outline'}
            className={cn(
              'w-full gap-2 rounded-xl',
              !canAccess && 'border-primary text-primary hover:bg-primary/5'
            )}
            onClick={handleNavigate}
          >
            {!canAccess && <Lock className="h-4 w-4" />}
            {service.cta_text || (canAccess ? 'Ver Detalhes' : 'Desbloquear')}
            {canAccess && <ArrowRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
