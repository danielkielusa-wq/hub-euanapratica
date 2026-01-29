import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HubService } from '@/types/hub';
import { useAuth } from '@/contexts/AuthContext';

interface FeaturedServiceBannerProps {
  service: HubService;
  hasAccess: boolean;
}

export function FeaturedServiceBanner({ service, hasAccess }: FeaturedServiceBannerProps) {
  const { user } = useAuth();

  const handleAction = () => {
    if (hasAccess && service.route) {
      window.location.href = service.route;
    } else if (service.ticto_checkout_url) {
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="relative overflow-hidden rounded-[48px] border bg-gradient-to-r from-slate-50 to-indigo-50 p-8 md:p-10">
      {/* Decorative elements */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-100/50" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/5" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Content */}
        <div className="flex-1">
          <Badge className="mb-3 gap-1 bg-amber-100 text-amber-700">
            <Star className="h-3 w-3 fill-amber-500" />
            OPORTUNIDADE PREMIUM
          </Badge>
          
          <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
            {service.name}
          </h2>
          
          <p className="mb-4 max-w-xl text-muted-foreground">
            {service.description}
          </p>

          {service.price && service.price > 0 && (
            <p className="mb-4 text-lg font-semibold text-foreground">
              {service.price_display || formatPrice(service.price)}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleAction}
              className="gap-2 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              {hasAccess ? 'Acessar Agora' : 'Agendar Diagnóstico'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="rounded-xl">
              Saiba mais
            </Button>
          </div>
        </div>

        {/* Visual Block */}
        <div className="hidden h-48 w-48 flex-shrink-0 items-center justify-center rounded-3xl bg-indigo-800 lg:flex">
          <div className="text-center text-white">
            <Sparkles className="mx-auto mb-2 h-8 w-8" />
            <span className="text-xs font-medium uppercase tracking-wider opacity-80">
              ESPECIALIDADE
            </span>
            <p className="mt-1 font-semibold">{service.category || 'Mentoria'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
