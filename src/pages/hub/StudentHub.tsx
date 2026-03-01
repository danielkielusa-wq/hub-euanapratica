import { useNavigate } from 'react-router-dom';
import * as icons from 'lucide-react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useHighlightedService, useSecondaryServices } from '@/hooks/useHighlightedService';
import { useHubDashboardConfig, isSectionVisible, DEFAULT_CONFIG } from '@/hooks/useHubDashboardConfig';
import { useCareerInsights } from '@/hooks/useCareerInsights';
import { useCommunityPulse } from '@/hooks/useCommunityPulse';
import { useSmartNextStep } from '@/hooks/useSmartNextStep';
import { useMyHub } from '@/hooks/useMyHub';
import { useChecklistStatus } from '@/hooks/useGuidedTour';
import { PriceDisplay } from '@/components/hub/PriceDisplay';
import { DashboardTour } from '@/components/guided-tour/DashboardTour';
import { GettingStartedChecklist } from '@/components/guided-tour/GettingStartedChecklist';
import { MyJourneySection } from '@/components/hub/MyJourneySection';
import { CareerHeroSection } from '@/components/hub/CareerHeroSection';
import { SmartNextStepCard } from '@/components/hub/SmartNextStepCard';
import { CareerDimensionsSection } from '@/components/hub/CareerDimensionsSection';
import { CommunityPulseSection } from '@/components/hub/CommunityPulseSection';
import { SmartUpsellSection } from '@/components/hub/SmartUpsellSection';
import { QuickToolsStrip } from '@/components/hub/QuickToolsStrip';

export default function StudentHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quota } = useSubscription();
  const { data: hubConfig } = useHubDashboardConfig();
  const { data: careerInsights } = useCareerInsights();
  const { data: highlightedService } = useHighlightedService();
  const { data: secondaryServices } = useSecondaryServices();
  const { data: myHubSections } = useMyHub();
  const { data: checklistItems } = useChecklistStatus();

  const config = hubConfig ?? DEFAULT_CONFIG;
  const planName = quota?.planName || 'Básico';
  const remainingCredits = quota?.remaining ?? 1;
  const userName = user?.full_name?.split(' ')[0] || 'Usuário';

  const { data: communityPulse } = useCommunityPulse(config.community_pulse.trending_period_days);

  const smartStep = useSmartNextStep({
    insights: careerInsights ?? null,
    sections: myHubSections ?? null,
    checklistItems: checklistItems ?? null,
    communityPulse: communityPulse ?? null,
    config,
  });

  // Helper for secondary services navigation
  const handleServiceAction = (service: { landing_page_url?: string | null; ticto_checkout_url?: string | null; route?: string | null }) => {
    if (service.landing_page_url) {
      if (service.landing_page_url.startsWith('/')) {
        navigate(service.landing_page_url);
      } else {
        try {
          const parsed = new URL(service.landing_page_url);
          if (parsed.origin === window.location.origin) {
            navigate(parsed.pathname);
          } else {
            window.open(service.landing_page_url, '_blank');
          }
        } catch {
          window.open(service.landing_page_url, '_blank');
        }
      }
    } else if (service.ticto_checkout_url) {
      window.open(service.ticto_checkout_url, '_blank');
    } else if (service.route) {
      navigate(service.route);
    } else {
      navigate('/catalogo');
    }
  };

  const getIcon = (iconName: string): LucideIcon => {
    const Icon = (icons as Record<string, LucideIcon>)[iconName];
    return Icon || icons.FileCheck;
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in pb-20 max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
        {/* Guided Tour (headless — triggers driver.js on first visit) */}
        <DashboardTour />

        {/* Vuexy 12-col grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Row 1: Hero (8) + NextStep/Checklist (4) */}
          {isSectionVisible(config, 'career_hero') && (
            <div className="lg:col-span-8">
              <CareerHeroSection
                config={config}
                insights={careerInsights ?? null}
                planName={planName}
                userName={userName}
              />
            </div>
          )}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {isSectionVisible(config, 'smart_next_step') && (
              <SmartNextStepCard step={smartStep} />
            )}
            {isSectionVisible(config, 'getting_started') && (
              <GettingStartedChecklist />
            )}
          </div>

          {/* Row 2: Journey (7) + Dimensions (5) */}
          {isSectionVisible(config, 'active_items') && (
            <div className="lg:col-span-7">
              <MyJourneySection excludeHistory />
            </div>
          )}
          {isSectionVisible(config, 'career_dimensions') && careerInsights?.hasReport && (
            <div className="lg:col-span-5">
              <CareerDimensionsSection
                insights={careerInsights}
                config={config}
              />
            </div>
          )}

          {/* Row 3: Quick Tools (full width) */}
          {isSectionVisible(config, 'quick_tools') && (
            <div className="lg:col-span-12">
              <QuickToolsStrip
                config={config}
                remainingCredits={remainingCredits}
              />
            </div>
          )}

          {/* Row 4: Community (5) + Upsell (7) */}
          {isSectionVisible(config, 'community_pulse') && communityPulse && (
            <div className="lg:col-span-5">
              <CommunityPulseSection
                pulse={communityPulse}
                config={config}
              />
            </div>
          )}
          {isSectionVisible(config, 'smart_upsell') && (
            <div className="lg:col-span-7">
              <SmartUpsellSection
                insights={careerInsights ?? null}
                highlightedService={highlightedService ?? null}
                config={config}
              />
            </div>
          )}

          {/* Row 5: Secondary Services (full width) */}
          {isSectionVisible(config, 'secondary_services') && secondaryServices && secondaryServices.length > 0 && (
            <div className="lg:col-span-12">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-medium text-foreground">
                  Outros Serviços
                </h3>
                <button
                  onClick={() => navigate('/catalogo')}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  Ver todos <MoreHorizontal size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {secondaryServices.map((service) => {
                  const ServiceIcon = getIcon(service.icon_name);
                  return (
                    <div key={service.id} className="bg-card p-6 rounded-md border-0 shadow-md hover:shadow-lg transition-all duration-200 group flex flex-col">
                      <div className="w-10 h-10 rounded-[4px] flex items-center justify-center mb-4 bg-primary/10 text-primary">
                        <ServiceIcon size={20} />
                      </div>
                      <h4 className="font-medium text-foreground mb-2">{service.name}</h4>
                      <p className="text-[13px] text-muted-foreground leading-relaxed mb-6 flex-1">{service.description}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        {service.price > 0 ? (
                          <PriceDisplay
                            price={service.price}
                            priceDisplay={service.price_display}
                            anchorPrice={service.anchor_price}
                            size="sm"
                          />
                        ) : (
                          <span className="text-xs font-medium text-foreground">Grátis</span>
                        )}
                        <button
                          onClick={() => handleServiceAction(service)}
                          className="text-[11px] font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-md group-hover:bg-[#7367f0] group-hover:text-white transition-all"
                        >
                          {service.cta_text || 'CONTRATAR'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
