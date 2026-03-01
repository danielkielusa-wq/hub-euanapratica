import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as icons from 'lucide-react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useHighlightedService, useSecondaryServices } from '@/hooks/useHighlightedService';
import { useHubDashboardConfig, isSectionVisible, DEFAULT_CONFIG } from '@/hooks/useHubDashboardConfig';
import { useCareerInsights } from '@/hooks/useCareerInsights';
import { useCareerAssessmentStatus } from '@/hooks/useCareerAssessmentStatus';
import { useCommunityPulse } from '@/hooks/useCommunityPulse';
import { useSmartNextStep } from '@/hooks/useSmartNextStep';
import { useMyHub } from '@/hooks/useMyHub';
import { useChecklistStatus, useGuidedTourState } from '@/hooks/useGuidedTour';
import { formatCurrency } from '@/components/hub/PriceDisplay';
import { DashboardTour } from '@/components/guided-tour/DashboardTour';
import { GettingStartedChecklist } from '@/components/guided-tour/GettingStartedChecklist';
import { MyJourneySection } from '@/components/hub/MyJourneySection';
import { CareerHeroSection } from '@/components/hub/CareerHeroSection';
import { CareerAssessmentSheet } from '@/components/hub/CareerAssessmentSheet';
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
  const { data: tourState } = useGuidedTourState();

  const { hasFeature } = usePlanAccess();

  const config = hubConfig ?? DEFAULT_CONFIG;
  const planName = quota?.planName || 'Básico';
  const remainingCredits = quota?.remaining ?? 1;
  const userName = user?.full_name?.split(' ')[0] || 'Usuário';

  // Career assessment funnel
  const assessmentStatus = useCareerAssessmentStatus({
    careerInsights: careerInsights ?? null,
    hasFullReportAccess: hasFeature('full_report_access'),
  });
  const [assessmentSheetOpen, setAssessmentSheetOpen] = useState(false);

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
      <div className="animate-fade-in pb-20 p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Guided Tour (headless — triggers driver.js on first visit) */}
        <DashboardTour />

        {/* Row 1: Hero + SmartNextStep (optional) + Credits */}
        {(() => {
          const hasSmartStep = isSectionVisible(config, 'smart_next_step') && !!smartStep;
          const hasChecklist = isSectionVisible(config, 'getting_started') && !tourState?.checklist_dismissed && !!checklistItems;
          const showMiddle = hasSmartStep || hasChecklist;

          return (
            <div className={`grid grid-cols-1 ${showMiddle ? 'lg:grid-cols-2 xl:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
              {isSectionVisible(config, 'career_hero') && (
                <div className={showMiddle ? 'col-span-1 lg:col-span-2' : 'col-span-1 lg:col-span-2'}>
                  <CareerHeroSection
                    config={config}
                    insights={careerInsights ?? null}
                    planName={planName}
                    userName={userName}
                    assessmentState={assessmentStatus.state}
                    completionPercent={assessmentStatus.completionPercent}
                    filledCount={assessmentStatus.filledCount}
                    onOpenAssessment={() => setAssessmentSheetOpen(true)}
                  />
                </div>
              )}

              {showMiddle && (
                <div className="flex flex-col gap-6">
                  {hasSmartStep && (
                    <SmartNextStepCard step={smartStep!} />
                  )}
                  {hasChecklist && (
                    <GettingStartedChecklist />
                  )}
                </div>
              )}

              {isSectionVisible(config, 'quick_tools') && (
                <QuickToolsStrip
                  config={config}
                  remainingCredits={remainingCredits}
                />
              )}
            </div>
          );
        })()}

        {/* Row 2: Journey (1-col) + Community (1-col) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isSectionVisible(config, 'active_items') && (
            <MyJourneySection excludeHistory />
          )}
          {isSectionVisible(config, 'community_pulse') && communityPulse && (
            <CommunityPulseSection
              pulse={communityPulse}
              config={config}
            />
          )}
        </div>

        {/* Row 3: Career Dimensions (full width, conditional) */}
        {isSectionVisible(config, 'career_dimensions') && careerInsights?.hasReport && (
          <CareerDimensionsSection
            insights={careerInsights}
            config={config}
          />
        )}

        {/* Row 4: Secondary Services (3-col ServiceCard pattern) */}
        {isSectionVisible(config, 'secondary_services') && secondaryServices && secondaryServices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {secondaryServices.map((service, idx) => {
              const ServiceIcon = getIcon(service.icon_name);
              const isHighlight = idx === 0;
              const priceLabel = service.price > 0
                ? (service.price_display || formatCurrency(service.price))
                : 'Grátis';
              return (
                <div
                  key={service.id}
                  onClick={() => handleServiceAction(service)}
                  className={`bg-white dark:bg-card p-6 rounded-xl shadow-sm border transition-all hover:shadow-md cursor-pointer ${
                    isHighlight ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-100 dark:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center justify-center">
                      <ServiceIcon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isHighlight ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                    }`}>
                      {priceLabel}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-foreground mb-2">{service.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">{service.description}</p>
                  <div className="flex items-center text-xs font-bold text-indigo-600 group">
                    {service.cta_text || 'Saiba mais'} <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Row 5: Upsell (full width) */}
        {isSectionVisible(config, 'smart_upsell') && (
          <SmartUpsellSection
            insights={careerInsights ?? null}
            highlightedService={highlightedService ?? null}
            config={config}
          />
        )}
      </div>

      {/* Career Assessment Sheet (multi-step form) */}
      <CareerAssessmentSheet
        open={assessmentSheetOpen}
        onOpenChange={setAssessmentSheetOpen}
        initialData={assessmentStatus.filledFields}
        onComplete={() => setAssessmentSheetOpen(false)}
      />
    </DashboardLayout>
  );
}
