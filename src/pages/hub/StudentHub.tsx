import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { FreeToolsSection } from '@/components/hub/FreeToolsSection';
import { UpsellBanner } from '@/components/hub/UpsellBanner';
import { SecondaryServicesGrid } from '@/components/hub/SecondaryServicesGrid';
import { useSubscription } from '@/hooks/useSubscription';
import { useHubServices } from '@/hooks/useHubServices';

export default function StudentHub() {
  const { quota, isLoading: quotaLoading } = useSubscription();
  const { data: services, isLoading: servicesLoading } = useHubServices();

  const isLoading = quotaLoading || servicesLoading;

  // Featured service (is_highlighted = true)
  const featuredService = services?.find(s => s.is_highlighted) || null;

  // Secondary services (consulting, live_mentoring) excluding the featured one
  const secondaryServices = services?.filter(s => 
    !s.is_highlighted && 
    (s.service_type === 'consulting' || s.service_type === 'live_mentoring')
  ) || [];

  // Plan display
  const planName = quota?.planName || 'Starter';
  const creditsRemaining = quota?.remaining ?? 1;
  const isFreePlan = quota?.planId === 'basic' || !quota?.planId;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-4 md:p-6 lg:p-10">
        <div className="mx-auto max-w-6xl animate-fade-in pb-20">
          {/* 1. Header Simplificado */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-black text-foreground tracking-tight">Seu Hub</h1>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold border border-border">
                Plano {planName} {isFreePlan ? '(Free)' : ''}
              </span>
            </div>
            <p className="text-muted-foreground">
              {isFreePlan 
                ? 'Comece sua jornada com suas ferramentas gratuitas.' 
                : 'Aproveite todos os benefícios do seu plano.'}
            </p>
          </div>

          {/* 2. Free Tier Value (The "Hook") */}
          <FreeToolsSection 
            creditsRemaining={creditsRemaining} 
            isLoading={isLoading} 
          />

          {/* 3. The High-Impact Upsell (Featured Service) */}
          <UpsellBanner 
            service={featuredService} 
            isLoading={isLoading} 
          />

          {/* 4. Secondary Services (Marketplace Style) */}
          <SecondaryServicesGrid 
            services={secondaryServices} 
            isLoading={isLoading} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
