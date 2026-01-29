import { useState } from 'react';
import { Wrench, FileCheck, BookOpen, Link2, Brain } from 'lucide-react';
import { ToolCard } from './ToolCard';
import { useHubServices, useUserHubAccess } from '@/hooks/useHubServices';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

// Icon mapping for dynamic services
const iconMap: Record<string, LucideIcon> = {
  FileCheck,
  BookOpen,
  Link2,
  Brain,
  Wrench,
};

// Static tools configuration (can be extended with hub_services data)
const STATIC_TOOLS = [
  {
    id: 'curriculo-usa',
    title: 'Currículo USA',
    description: 'Valide seu CV nos robôs ATS americanos com IA avançada.',
    icon: FileCheck,
    route: '/curriculo',
    requiredServiceRoute: '/curriculo',
  },
  {
    id: 'biblioteca',
    title: 'Biblioteca',
    description: 'Acesse todos os materiais e recursos dos seus espaços.',
    icon: BookOpen,
    route: '/biblioteca',
    requiredServiceRoute: null, // Always available
  },
];

export function ToolsGrid() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { data: services, isLoading: servicesLoading } = useHubServices();
  const { data: userAccess = [] } = useUserHubAccess();
  const { quota } = useSubscription();

  // Filter AI tools from hub_services
  const aiTools = services?.filter(s => s.service_type === 'ai_tool') || [];

  // Determine plan badge based on service status
  const getPlanBadge = (service: any): 'pro' | 'vip' | null => {
    if (service.status === 'premium') {
      // Check accent_color or other metadata for VIP distinction
      if (service.accent_color?.includes('amber') || service.ribbon === 'EXCLUSIVO') {
        return 'vip';
      }
      return 'pro';
    }
    return null;
  };

  // Check if user has access to a service
  const hasServiceAccess = (service: any) => {
    if (service.status === 'available') return true;
    return userAccess.includes(service.id);
  };

  if (servicesLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-[32px]" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Ecossistema de Ferramentas</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Render AI tools from hub_services */}
          {aiTools.map((service) => {
            const Icon = iconMap[service.icon_name] || FileCheck;
            return (
              <ToolCard
                key={service.id}
                title={service.name}
                description={service.description || ''}
                icon={Icon}
                route={service.route || '#'}
                hasAccess={hasServiceAccess(service)}
                planBadge={getPlanBadge(service)}
                isNew={service.ribbon === 'NOVO'}
                onUpgradeClick={() => setShowUpgradeModal(true)}
              />
            );
          })}

          {/* Render static tools */}
          {STATIC_TOOLS.filter(tool => !aiTools.find(s => s.route === tool.route)).map((tool) => {
            // Check access for static tools
            const matchingService = services?.find(s => s.route === tool.requiredServiceRoute);
            const hasAccess = !tool.requiredServiceRoute || 
              !matchingService || 
              hasServiceAccess(matchingService);

            return (
              <ToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                route={tool.route}
                hasAccess={hasAccess}
                onUpgradeClick={() => setShowUpgradeModal(true)}
              />
            );
          })}
        </div>
      </section>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reason="upgrade"
      />
    </>
  );
}
