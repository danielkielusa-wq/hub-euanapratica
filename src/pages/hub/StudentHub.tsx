import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { FreeToolsSection } from '@/components/hub/FreeToolsSection';
import { UpsellBanner } from '@/components/hub/UpsellBanner';
import { SecondaryServicesGrid } from '@/components/hub/SecondaryServicesGrid';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useHubServices } from '@/hooks/useHubServices';
import { cn } from '@/lib/utils';

export default function StudentHub() {
  const { planName, planId, theme, getRemaining, isLoading: planLoading } = usePlanAccess();
  const { data: services, isLoading: servicesLoading } = useHubServices();

  const isLoading = planLoading || servicesLoading;

  // Featured service (is_highlighted = true)
  const featuredService = services?.find(s => s.is_highlighted) || null;

  // Secondary services (consulting, live_mentoring) excluding the featured one
  const secondaryServices = services?.filter(s => 
    !s.is_highlighted && 
    (s.service_type === 'consulting' || s.service_type === 'live_mentoring')
  ) || [];

  const creditsRemaining = getRemaining('resume_pass');
  const isFreePlan = planId === 'basic' || !planId;

  // Theme-based badge styling
  const getBadgeClasses = () => {
    switch (theme) {
      case 'purple':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'blue':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-4 md:p-6 lg:p-10">
        <div className="mx-auto max-w-6xl animate-fade-in pb-20">
          {/* 1. Header com Badge de Plano */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-black text-foreground tracking-tight">Seu Hub</h1>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold border",
                getBadgeClasses()
              )}>
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
