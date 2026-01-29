import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MemberCard } from '@/components/hub/MemberCard';
import { EventsSection } from '@/components/hub/EventsSection';
import { ToolsGrid } from '@/components/hub/ToolsGrid';
import { ServicesSection } from '@/components/hub/ServicesSection';
import { SocialProofBanner } from '@/components/hub/SocialProofBanner';
import { Sparkles } from 'lucide-react';

export default function StudentHub() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-4 md:p-6 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header Badge */}
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">SEU ECOSSISTEMA</span>
          </div>

          {/* Member Card Premium */}
          <MemberCard />

          {/* Events & Hot Seats */}
          <EventsSection />

          {/* Tools Grid */}
          <ToolsGrid />

          {/* High-Touch Services */}
          <ServicesSection />

          {/* Social Proof Footer */}
          <SocialProofBanner />
        </div>
      </div>
    </DashboardLayout>
  );
}
