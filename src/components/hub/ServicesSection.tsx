import { Link } from 'react-router-dom';
import { Briefcase, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useHubServices, useUserHubAccess } from '@/hooks/useHubServices';
import { FeaturedServiceBanner } from './FeaturedServiceBanner';
import { ServiceCard } from './ServiceCard';
import { HubService } from '@/types/hub';

export function ServicesSection() {
  const { data: services, isLoading } = useHubServices();
  const { data: userAccess = [] } = useUserHubAccess();

  if (isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-64 rounded-[48px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-[32px]" />
          ))}
        </div>
      </section>
    );
  }

  // Find featured service (is_highlighted = true)
  const featuredService = services?.find(s => s.is_highlighted);
  
  // Filter high-touch services (live_mentoring, consulting) excluding featured
  const highTouchServices = services?.filter(
    s => (s.service_type === 'live_mentoring' || s.service_type === 'consulting') && 
         s.id !== featuredService?.id
  ) || [];

  // Check if user has access to a service
  const hasAccess = (service: HubService) => {
    if (service.status === 'available') return true;
    return userAccess.includes(service.id);
  };

  if (!featuredService && highTouchServices.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Serviços High-Touch</h2>
        </div>
        <Link 
          to="/catalogo" 
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver catálogo completo →
        </Link>
      </div>

      {/* Featured Banner */}
      {featuredService && (
        <FeaturedServiceBanner 
          service={featuredService} 
          hasAccess={hasAccess(featuredService)} 
        />
      )}

      {/* Services Grid */}
      {highTouchServices.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {highTouchServices.slice(0, 6).map((service) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              hasAccess={hasAccess(service)} 
            />
          ))}
        </div>
      )}
    </section>
  );
}
