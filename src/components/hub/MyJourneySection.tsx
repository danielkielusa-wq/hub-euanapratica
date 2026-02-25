import { AlertCircle, PlayCircle, Calendar, History, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { JourneyCard, PlanToolCard } from './JourneyCard';
import { useMyHub, usePlanTools } from '@/hooks/useMyHub';
import type { HubSectionId } from '@/types/hub';

const SECTION_ICONS: Record<HubSectionId, React.ElementType> = {
  needs_action: AlertCircle,
  active: PlayCircle,
  upcoming: Calendar,
  history: History,
};

const SECTION_ICON_COLORS: Record<HubSectionId, string> = {
  needs_action: 'text-amber-500',
  active: 'text-emerald-500',
  upcoming: 'text-blue-500',
  history: 'text-gray-400',
};

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function MyJourneySection() {
  const { data: sections, isLoading: hubLoading } = useMyHub();
  const { data: planTools, isLoading: toolsLoading } = usePlanTools();

  const isLoading = hubLoading || toolsLoading;

  const hasAnything =
    (sections && sections.length > 0) || (planTools && planTools.length > 0);

  if (isLoading) {
    return (
      <div className="mb-10 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        <SectionSkeleton />
      </div>
    );
  }

  if (!hasAnything) return null;

  return (
    <div className="mb-10 space-y-8">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-black text-gray-900">Minha Jornada</h2>
        <span className="text-xs text-gray-400 font-medium">
          — tudo que você tem acesso
        </span>
      </div>

      {/* Purchased / active services grouped by section */}
      {sections?.map((section) => {
        const Icon = SECTION_ICONS[section.id];
        const iconColor = SECTION_ICON_COLORS[section.id];

        return (
          <div key={section.id}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`h-4 w-4 ${iconColor}`} />
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                {section.label}
              </h3>
              <span className="text-xs text-gray-400 ml-1">({section.items.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.map((item) => (
                <JourneyCard key={item.user_service_id} item={item} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Plan-included tools */}
      {planTools && planTools.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Ferramentas do seu Plano
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planTools.map((tool) => (
              <PlanToolCard key={tool.service.id} tool={tool} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
