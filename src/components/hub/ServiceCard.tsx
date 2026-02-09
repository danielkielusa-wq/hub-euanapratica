import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, LucideIcon } from 'lucide-react';
import * as icons from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HubService, SERVICE_TYPE_LABELS, ServiceType } from '@/types/hub';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get icon component safely
  const iconName = service.icon_name as keyof typeof icons;
  const Icon = (icons[iconName] as LucideIcon) || icons.FileCheck;
  
  const serviceType = (service.service_type as ServiceType) || 'consulting';
  const typeColor = serviceTypeColors[serviceType] || serviceTypeColors.consulting;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleUnlock = () => {
    // Priority 1: Landing page URL (presentation page)
    if (service.landing_page_url) {
      if (service.landing_page_url.startsWith('/')) {
        navigate(service.landing_page_url);
      } else {
        window.open(service.landing_page_url, '_blank');
      }
    }
    // Priority 2: Ticto checkout URL (direct purchase)
    else if (service.ticto_checkout_url) {
      try {
        const checkoutUrl = new URL(service.ticto_checkout_url);
        if (user?.email) {
          checkoutUrl.searchParams.set('email', user.email);
        }
        window.open(checkoutUrl.toString(), '_blank');
      } catch {
        window.open(service.ticto_checkout_url, '_blank');
      }
    }
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
        <p className="mb-4 font-semibold text-foreground">
          {service.price_display || formatPrice(service.price)}
        </p>
      )}

      {/* Action */}
      <div className="mt-auto">
        {isComingSoon ? (
          <Button variant="outline" disabled className="w-full rounded-xl">
            Em Breve
          </Button>
        ) : canAccess && service.route ? (
          <Link to={service.route}>
            <Button className="w-full gap-2 rounded-xl">
              {service.cta_text || 'Acessar'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (service.landing_page_url || service.ticto_checkout_url) ? (
          <Button
            variant="outline"
            className="w-full gap-2 rounded-xl border-primary text-primary hover:bg-primary/5"
            onClick={handleUnlock}
          >
            <Lock className="h-4 w-4" />
            Desbloquear
          </Button>
        ) : (
          <Button variant="outline" className="w-full rounded-xl">
            Saiba mais
          </Button>
        )}
      </div>
    </div>
  );
}
