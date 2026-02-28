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
import type { HubDashboardSectionId } from '@/types/hub';

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

  // Section renderer — maps sectionId to component
  const renderSection = (sectionId: HubDashboardSectionId) => {
    if (!isSectionVisible(config, sectionId)) return null;

    switch (sectionId) {
      case 'career_hero':
        return (
          <CareerHeroSection
            key={sectionId}
            config={config}
            insights={careerInsights ?? null}
            planName={planName}
            userName={userName}
          />
        );

      case 'smart_next_step':
        return <SmartNextStepCard key={sectionId} step={smartStep} />;

      case 'active_items':
        return <MyJourneySection key={sectionId} excludeHistory />;

      case 'career_dimensions':
        if (!careerInsights?.hasReport) return null;
        return (
          <CareerDimensionsSection
            key={sectionId}
            insights={careerInsights}
            config={config}
          />
        );

      case 'community_pulse':
        if (!communityPulse) return null;
        return (
          <CommunityPulseSection
            key={sectionId}
            pulse={communityPulse}
            config={config}
          />
        );

      case 'smart_upsell':
        return (
          <SmartUpsellSection
            key={sectionId}
            insights={careerInsights ?? null}
            highlightedService={highlightedService ?? null}
            config={config}
          />
        );

      case 'quick_tools':
        return (
          <QuickToolsStrip
            key={sectionId}
            config={config}
            remainingCredits={remainingCredits}
          />
        );

      case 'getting_started':
        return (
          <div key={sectionId} className="mb-10">
            <GettingStartedChecklist />
          </div>
        );

      case 'secondary_services':
        if (!secondaryServices || secondaryServices.length === 0) return null;
        return (
          <div key={sectionId}>
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Outros Serviços
              </h3>
              <button
                onClick={() => navigate('/catalogo')}
                className="text-xs font-bold text-gray-400 hover:text-gray-900 flex items-center gap-1"
              >
                Ver todos <MoreHorizontal size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {secondaryServices.map((service) => {
                const ServiceIcon = getIcon(service.icon_name);
                return (
                  <div key={service.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all group flex flex-col">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gray-50 text-gray-600">
                      <ServiceIcon size={24} />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{service.name}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-1">{service.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      {service.price > 0 ? (
                        <PriceDisplay
                          price={service.price}
                          priceDisplay={service.price_display}
                          anchorPrice={service.anchor_price}
                          size="sm"
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-900">Grátis</span>
                      )}
                      <button
                        onClick={() => handleServiceAction(service)}
                        className="text-[10px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all"
                      >
                        {service.cta_text || 'CONTRATAR'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in pb-20 max-w-6xl mx-auto p-4 md:p-6 lg:p-10">
        {/* Guided Tour (headless — triggers driver.js on first visit) */}
        <DashboardTour />

        {/* Render sections in config-defined order */}
        {config.sections_order.map(renderSection)}
      </div>
    </DashboardLayout>
  );
}
