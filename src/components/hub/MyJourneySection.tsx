import { AlertCircle, PlayCircle, Calendar, History, Zap, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { JourneyCard, PlanToolCard } from './JourneyCard';
import { LiveHubCard } from './LiveHubCard';
import { useMyHub, usePlanTools } from '@/hooks/useMyHub';
import { useMyLives } from '@/hooks/useMyLives';
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

interface MyJourneySectionProps {
  excludeHistory?: boolean;
}

export function MyJourneySection({ excludeHistory = false }: MyJourneySectionProps) {
  const { data: sections, isLoading: hubLoading } = useMyHub();
  const { data: planTools, isLoading: toolsLoading } = usePlanTools();
  const { data: myLives, isLoading: livesLoading } = useMyLives();

  const isLoading = hubLoading || toolsLoading || livesLoading;

  const hasAnything =
    (sections && sections.length > 0) || (planTools && planTools.length > 0) || (myLives && myLives.length > 0);

  if (isLoading) {
    return (
      <div className="bg-card rounded-md shadow-md p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <SectionSkeleton />
      </div>
    );
  }

  if (!hasAnything) return null;

  return (
    <div className="bg-card rounded-md shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-foreground">Minha Jornada</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Tudo que você tem acesso
        </p>
      </div>

      {/* Purchased / active services grouped by section */}
      {sections?.filter((s) => !(excludeHistory && s.id === 'history')).map((section) => {
        const Icon = SECTION_ICONS[section.id];
        const iconColor = SECTION_ICON_COLORS[section.id];

        return (
          <div key={section.id}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`h-4 w-4 ${iconColor}`} />
              <h3 className="text-[13px] font-medium text-foreground uppercase tracking-wide">
                {section.label}
              </h3>
              <span className="text-xs text-muted-foreground ml-1">({section.items.length})</span>
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
            <h3 className="text-[13px] font-medium text-foreground uppercase tracking-wide">
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

      {/* Registered lives — show max 2, prioritize live > scheduled > completed */}
      {myLives && myLives.length > 0 && (() => {
        const STATUS_PRIORITY: Record<string, number> = { live: 0, scheduled: 1, completed: 2 };
        const sorted = [...myLives].sort((a, b) => {
          const pa = STATUS_PRIORITY[a.live.status] ?? 3;
          const pb = STATUS_PRIORITY[b.live.status] ?? 3;
          if (pa !== pb) return pa - pb;
          return new Date(a.live.scheduled_at).getTime() - new Date(b.live.scheduled_at).getTime();
        });
        const display = sorted.slice(0, 2);
        const total = myLives.length;

        return (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Radio className="h-4 w-4 text-red-500" />
              <h3 className="text-[13px] font-medium text-foreground uppercase tracking-wide">
                Minhas Lives
              </h3>
              <span className="text-xs text-muted-foreground ml-1">({total})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {display.map((item) => (
                <LiveHubCard key={item.registration_id} item={item} />
              ))}
            </div>
            {total > 2 && (
              <div className="mt-3 text-center">
                <Link
                  to="/lives"
                  className="text-sm font-medium text-[#7367f0] hover:text-[#7367f0]/80 hover:underline"
                >
                  Ver todas ({total})
                </Link>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
